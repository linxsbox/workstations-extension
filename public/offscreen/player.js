/**
 * Offscreen Document 音频播放器
 * 用于在后台持续播放音频，不受页面关闭影响
 */

// 常量定义（直接在这里定义，避免导入问题）
const PLAYER_LOCATION = {
  INDEX: 'index',
  OFFSCREEN: 'offscreen',
  NONE: 'none',
};

const MESSAGE_TYPES = {
  PLAY: 'PLAYER_PLAY',
  PAUSE: 'PLAYER_PAUSE',
  STOP: 'PLAYER_STOP',
  NEXT: 'PLAYER_NEXT',
  PREVIOUS: 'PLAYER_PREVIOUS',
  SEEK: 'PLAYER_SEEK',
  SET_VOLUME: 'PLAYER_SET_VOLUME',
  SET_PLAYBACK_RATE: 'PLAYER_SET_PLAYBACK_RATE',
  HANDOVER_TO_OFFSCREEN: 'HANDOVER_TO_OFFSCREEN',
  HANDOVER_TO_INDEX: 'HANDOVER_TO_INDEX',
  GET_PLAYER_STATE: 'GET_PLAYER_STATE',
  PLAYER_STATE_RESPONSE: 'PLAYER_STATE_RESPONSE',
  CREATE_OFFSCREEN: 'CREATE_OFFSCREEN',
  CLOSE_OFFSCREEN: 'CLOSE_OFFSCREEN',
  OFFSCREEN_READY: 'OFFSCREEN_READY',
};

console.log('[Offscreen Player] Initializing...');

// 音频元素
let audio = null;

// 当前播放状态
let currentState = {
  location: PLAYER_LOCATION.OFFSCREEN,
  trackId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isLoading: false,
  volume: 0.8,
  playbackRate: 1,
};

/**
 * 初始化音频元素
 */
function initAudio() {
  if (audio) return;

  audio = new Audio();

  // 事件监听
  audio.addEventListener('loadstart', () => {
    currentState.isLoading = true;
    console.log('[Offscreen Player] Loading audio...');
  });

  audio.addEventListener('canplay', () => {
    currentState.isLoading = false;
    currentState.duration = audio.duration;
    console.log('[Offscreen Player] Audio ready, duration:', audio.duration);
  });

  audio.addEventListener('play', () => {
    currentState.isPlaying = true;
    console.log('[Offscreen Player] Playing');
  });

  audio.addEventListener('pause', () => {
    currentState.isPlaying = false;
    console.log('[Offscreen Player] Paused');
  });

  audio.addEventListener('timeupdate', () => {
    currentState.currentTime = audio.currentTime;
  });

  audio.addEventListener('ended', () => {
    currentState.isPlaying = false;
    console.log('[Offscreen Player] Playback ended');
    // TODO: 自动播放下一首
  });

  audio.addEventListener('error', (e) => {
    console.error('[Offscreen Player] Audio error:', e);
    currentState.isLoading = false;
  });

  console.log('[Offscreen Player] Audio element initialized');
}

/**
 * 从 chrome.storage 加载播放队列
 */
async function loadPlayQueue() {
  // 检查 chrome.storage 是否可用
  if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error('[Offscreen Player] chrome.storage is not available');
    return null;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get('PLAYER_PLAY_QUEUE', (result) => {
      if (chrome.runtime.lastError) {
        console.error('[Offscreen Player] Storage error:', chrome.runtime.lastError);
        resolve(null);
        return;
      }

      if (result.PLAYER_PLAY_QUEUE) {
        console.log('[Offscreen Player] Loaded queue:', result.PLAYER_PLAY_QUEUE);
        resolve(result.PLAYER_PLAY_QUEUE);
      } else {
        console.warn('[Offscreen Player] No queue found in storage');
        resolve(null);
      }
    });
  });
}

/**
 * 根据 trackId 查找曲目
 */
async function findTrackById(trackId) {
  const queue = await loadPlayQueue();
  if (!queue || !queue.tracks) return null;

  return queue.tracks.find(track => track.id === trackId);
}

/**
 * 加载并播放音频
 */
async function loadAndPlay(track, startTime = 0) {
  initAudio();

  if (!track || !track.src) {
    console.error('[Offscreen Player] Invalid track:', track);
    return false;
  }

  console.log('[Offscreen Player] Loading track:', track.title);

  currentState.trackId = track.id;
  audio.src = track.src;
  audio.volume = currentState.volume;
  audio.playbackRate = currentState.playbackRate;

  // 等待音频加载完成
  await new Promise((resolve) => {
    audio.addEventListener('canplay', resolve, { once: true });
  });

  // 跳转到指定时间
  if (startTime > 0) {
    audio.currentTime = startTime;
  }

  // 开始播放
  try {
    await audio.play();
    return true;
  } catch (error) {
    console.error('[Offscreen Player] Play failed:', error);
    return false;
  }
}

/**
 * 播放控制函数
 */
const playerControls = {
  play: () => {
    if (audio && audio.paused) {
      audio.play();
    }
  },

  pause: () => {
    if (audio && !audio.paused) {
      audio.pause();
    }
  },

  stop: () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  },

  seek: (time) => {
    if (audio) {
      audio.currentTime = time;
    }
  },

  setVolume: (volume) => {
    if (audio) {
      audio.volume = volume;
      currentState.volume = volume;
    }
  },

  setPlaybackRate: (rate) => {
    if (audio) {
      audio.playbackRate = rate;
      currentState.playbackRate = rate;
    }
  },
};

/**
 * 处理来自 Service Worker 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Offscreen Player] Received message:', message.type);

  switch (message.type) {
    case MESSAGE_TYPES.HANDOVER_TO_OFFSCREEN:
      // 接管播放（异步）
      handleHandover(message.data)
        .then((result) => {
          console.log('[Offscreen Player] Handover result:', result);
          sendResponse(result);
        })
        .catch((error) => {
          console.error('[Offscreen Player] Handover error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 保持消息通道打开

    case MESSAGE_TYPES.GET_PLAYER_STATE:
      // 返回当前状态
      sendResponse(currentState);
      break;

    case MESSAGE_TYPES.PLAY:
      playerControls.play();
      sendResponse({ success: true });
      break;

    case MESSAGE_TYPES.PAUSE:
      playerControls.pause();
      sendResponse({ success: true });
      break;

    case MESSAGE_TYPES.STOP:
      playerControls.stop();
      sendResponse({ success: true });
      break;

    case MESSAGE_TYPES.SEEK:
      playerControls.seek(message.data.time);
      sendResponse({ success: true });
      break;

    case MESSAGE_TYPES.SET_VOLUME:
      playerControls.setVolume(message.data.volume);
      sendResponse({ success: true });
      break;

    case MESSAGE_TYPES.SET_PLAYBACK_RATE:
      playerControls.setPlaybackRate(message.data.rate);
      sendResponse({ success: true });
      break;

    default:
      console.warn('[Offscreen Player] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

/**
 * 处理播放交接
 */
async function handleHandover(data) {
  const { track, currentTime } = data;

  console.log('[Offscreen Player] Handling handover:', { track: track.title, currentTime });

  const success = await loadAndPlay(track, currentTime);

  return { success };
}

/**
 * 初始化
 */
console.log('[Offscreen Player] Ready');

// 通知 Service Worker 已就绪
chrome.runtime.sendMessage({
  type: MESSAGE_TYPES.OFFSCREEN_READY
}).then(() => {
  console.log('[Offscreen Player] Ready message sent successfully');
}).catch((error) => {
  console.error('[Offscreen Player] Failed to send ready message:', error);
});
