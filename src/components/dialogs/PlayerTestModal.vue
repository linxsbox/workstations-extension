<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { storePlayer } from '@/stores/modules/player';
import { PlayMode, PlayModeConfig } from '@/stores/modules/player/types';

const player = storePlayer();
const {
  playStatus,
  playQueue,
  playMode,
  playlists,
  currentPlaylistId,
  volume,
  playbackRate,
} = storeToRefs(player);

const showModal = ref(false);
const testAudioUrl = ref('');
const playlistName = ref('');
const testTracks = ref([
  {
    id: '1',
    title: '测试音乐 1',
    artist: '测试艺术家 1',
    src: 'https://freetyst.nf.migu.cn/public/product9th/product46/2023/03/3108/2019%E5%B9%B412%E6%9C%8831%E6%97%A522%E7%82%B912%E5%88%86%E7%B4%A7%E6%80%A5%E5%86%85%E5%AE%B9%E5%87%86%E5%85%A5%E7%9B%B8%E4%BF%A11%E9%A6%96/%E6%A0%87%E6%B8%85%E9%AB%98%E6%B8%85/MP3_128_16_Stero/60070101817085948.mp3?channelid=02&msisdn=94302880-faf2-4520-9f7a-3455a972689d&Tim=1748227654949&Key=af768425920778af',
    duration: 0, // 由系统自动计算，初始值为 0
  },
  {
    id: '2',
    title: '测试音乐 2',
    artist: '测试艺术家 2',
    src: 'https://freetyst.nf.migu.cn/public/product9th/product45/2022/06/0814/2013%E5%B9%B405%E6%9C%8807%E6%97%A5%E6%BB%9A%E7%9F%B3%E5%94%B1%E7%89%87%E5%86%85%E5%AE%B9%E5%87%86%E5%85%A5327%E9%A6%96/%E6%A0%87%E6%B8%85%E9%AB%98%E6%B8%85/MP3_128_16_Stero/63480207146145922.mp3?channelid=02&msisdn=774bc799-ea14-4f1b-859f-386bd83e5dc8&Tim=1748227930757&Key=71ba14b24fbdcdae',
    duration: 0, // 由系统自动计算，初始值为 0
  },
  {
    id: '3',
    title: '测试音乐 3',
    artist: '测试艺术家 3',
    src: 'https://freetyst.nf.migu.cn/public/product9th/product45/2022/05/0910/2016%E5%B9%B401%E6%9C%8812%E6%97%A510%E7%82%B910%E5%88%86%E5%86%85%E5%AE%B9%E5%87%86%E5%85%A5%E7%9B%B8%E4%BF%A1%E9%9F%B3%E4%B9%905024%E9%A6%96/%E6%A0%87%E6%B8%85%E9%AB%98%E6%B8%85/MP3_128_16_Stero/64049300173103146.mp3?channelid=02&msisdn=77a3aff0-3b8d-4883-8595-300bbdf52974&Tim=1748228785515&Key=5334d925f1671f96',
    duration: 0, // 由系统自动计算，初始值为 0
  },
]);

// 创建测试播放列表
const createTestPlaylist = () => {
  if (playlistName.value) {
    const playlist = player.createPlaylist(playlistName.value);
    playlistName.value = '';
    console.log('Created playlist:', playlist);
  }
};

// 添加测试轨道到当前播放列表
const addTestTracksToPlaylist = () => {
  if (!currentPlaylistId.value) {
    alert('请先创建或选择播放列表');
    return;
  }

  testTracks.value.forEach(track => {
    player.addTrackToPlaylist(currentPlaylistId.value, track);
  });

  // 从播放列表初始化队列
  player.initQueueFromPlaylist(currentPlaylistId.value);
};

// 当前播放列表信息
const currentPlaylist = computed(() => {
  return player.getCurrentPlaylist;
});

// 模式名称
const playModeName = computed(() => {
  return PlayModeConfig[playMode.value]?.label || '未知';
});

const playModeIcon = computed(() => {
  return PlayModeConfig[playMode.value]?.icon || '';
});

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// 获取轨道的准确时长
// 对于当前播放的轨道，使用实时的 player.duration（从音源自动获取）
// 对于其他轨道，使用轨道对象的 duration（如果有的话）
const getTrackDuration = (track, index) => {
  if (index === playQueue.value.currentIndex) {
    return player.duration || track.duration || 0;
  }
  return track.duration || 0;
};

// 获取当前轨道信息
const currentTrack = computed(() => {
  return playQueue.value.getCurrentTrack() || null;
});

// 获取下一首轨道
const nextTrack = computed(() => {
  const nextIndex = playQueue.value.getNextIndex();
  return nextIndex >= 0 ? playQueue.value.tracks[nextIndex] : null;
});

// 播放指定轨道
const playTrack = (trackId) => {
  player.playTrackFromQueue(trackId);
};

// 移除轨道
const removeTrack = (trackId) => {
  player.removeFromQueue(trackId);
};

// 进度条相关
const progressBar = ref(null);
const isDraggingProgress = ref(false);

// 计算进度百分比
const progressPercent = computed(() => {
  return player.duration ? (player.currentTime / player.duration) * 100 : 0;
});

// 点击进度条跳转
const handleProgressClick = (e) => {
  if (!player.duration) return;

  const rect = progressBar.value.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  const newTime = percent * player.duration;

  player.seek(newTime);
};

// 拖动进度条
const handleProgressMouseDown = (e) => {
  isDraggingProgress.value = true;

  const onMouseMove = (moveEvent) => {
    if (!player.duration) return;

    const rect = progressBar.value.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
    const newTime = percent * player.duration;

    player.seek(newTime);
  };

  const onMouseUp = () => {
    isDraggingProgress.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};
</script>

<template>
  <div>
    <!-- 打开测试Modal按钮 -->
    <button @click="showModal = true" class="test-btn">
      🎵 打开播放器测试
    </button>

    <!-- 测试Modal -->
    <div v-show="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>🎵 播放器功能测试</h2>
          <button @click="showModal = false" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <!-- 1. 播放状态信息 -->
          <section class="section">
            <h3>📊 播放状态</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>后端类型:</label>
                <span>{{ player.backendName }}</span>
              </div>
              <div class="info-item">
                <label>播放状态:</label>
                <span>{{ playStatus.isPlaying ? '▶️ 播放中' : '⏸️ 已暂停' }}</span>
              </div>
              <div class="info-item">
                <label>当前时间:</label>
                <span>{{ formatTime(player.currentTime) }}</span>
              </div>
              <div class="info-item">
                <label>总时长:</label>
                <span>{{ formatTime(player.duration) }}</span>
              </div>
            </div>
          </section>

          <!-- 1.5 进度条控制 -->
          <section class="section">
            <h3>⏱️ 进度条</h3>
            <div class="progress-control">
              <div class="time-display">{{ formatTime(player.currentTime) }}</div>
              <div
                ref="progressBar"
                class="progress-bar-container"
                @click="handleProgressClick"
                @mousedown="handleProgressMouseDown"
              >
                <div
                  class="progress-bar-fill"
                  :style="{ width: progressPercent + '%' }"
                  :class="{ dragging: isDraggingProgress }"
                >
                  <div class="progress-slider"></div>
                </div>
              </div>
              <div class="time-display">{{ formatTime(player.duration) }}</div>
            </div>
          </section>

          <!-- 2. 播放模式和队列控制 -->
          <section class="section">
            <h3>🎛️ 播放控制</h3>
            <div class="control-panel">
              <div class="button-group">
                <button @click="player.playPrevious()" class="ctrl-btn">⏮️ 上一首</button>
                <button @click="player.togglePlay()" class="ctrl-btn primary">
                  {{ playStatus.isPlaying ? '⏸️ 暂停' : '▶️ 播放' }}
                </button>
                <button @click="player.playNext()" class="ctrl-btn">⏭️ 下一首</button>
              </div>
              <div class="mode-info">
                <span class="icon">{{ playModeIcon }}</span>
                <span class="label">{{ playModeName }}</span>
                <button @click="player.switchPlayMode()" class="switch-btn">切换模式</button>
              </div>
            </div>
          </section>

          <!-- 3. 播放列表管理 -->
          <section class="section">
            <h3>📋 播放列表管理</h3>
            <div class="playlist-mgmt">
              <div class="input-group">
                <input
                  v-model="playlistName"
                  type="text"
                  placeholder="输入播放列表名称"
                  class="input"
                />
                <button @click="createTestPlaylist" class="btn">创建列表</button>
              </div>

              <div v-if="playlists.length > 0" class="playlists-list">
                <div
                  v-for="playlist in playlists"
                  :key="playlist.id"
                  class="playlist-item"
                  :class="{ active: playlist.id === currentPlaylistId }"
                >
                  <div class="playlist-info">
                    <div class="name">{{ playlist.name }}</div>
                    <div class="detail">{{ playlist.getTrackCount() }} 首 • {{ formatTime(playlist.getDuration()) }}</div>
                  </div>
                  <button
                    v-if="playlist.id === currentPlaylistId"
                    @click="player.initQueueFromPlaylist(playlist.id)"
                    class="btn-small"
                  >
                    已选中
                  </button>
                  <button
                    v-else
                    @click="player.initQueueFromPlaylist(playlist.id)"
                    class="btn-small"
                  >
                    选中
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 4. 添加测试轨道 -->
          <section class="section">
            <h3>➕ 添加测试轨道</h3>
            <button @click="addTestTracksToPlaylist" class="btn primary">
              添加 3 首测试音乐到当前列表
            </button>
          </section>

          <!-- 5. 当前队列状态 -->
          <section class="section">
            <h3>📍 当前队列 ({{ playQueue.getTrackCount() }} 首)</h3>

            <!-- 当前播放曲目 -->
            <div v-if="currentTrack" class="current-track">
              <div class="track-header">▶️ 当前播放</div>
              <div class="track-info">
                <div class="title">{{ currentTrack.title }}</div>
                <div class="artist">{{ currentTrack.artist }}</div>
              </div>
            </div>

            <!-- 下一首 -->
            <div v-if="nextTrack" class="next-track">
              <div class="track-header">⏭️ 下一首</div>
              <div class="track-info">
                <div class="title">{{ nextTrack.title }}</div>
                <div class="artist">{{ nextTrack.artist }}</div>
              </div>
            </div>

            <!-- 队列列表 -->
            <div v-if="playQueue.tracks.length > 0" class="queue-list">
              <div class="list-header">队列列表</div>
              <div class="tracks-container">
                <div
                  v-for="(track, index) in playQueue.tracks"
                  :key="track.id"
                  class="queue-item"
                  :class="{ current: index === playQueue.currentIndex }"
                >
                  <span class="index">{{ index + 1 }}</span>
                  <div class="track-details">
                    <div class="track-title">{{ track.title }}</div>
                    <div class="track-artist">{{ track.artist }}</div>
                  </div>
                  <span class="duration">{{ formatTime(getTrackDuration(track, index)) }}</span>
                  <div class="actions">
                    <button
                      @click="playTrack(track.id)"
                      class="action-btn play"
                      title="播放"
                    >
                      ▶️
                    </button>
                    <button
                      @click="removeTrack(track.id)"
                      class="action-btn remove"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              队列为空，请添加测试轨道
            </div>
          </section>

          <!-- 6. 音量和速率控制 -->
          <section class="section">
            <h3>🔧 音量和速率</h3>
            <div class="slider-group">
              <div class="slider-item">
                <label>音量: {{ Math.round(volume * 100) }}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  :value="volume"
                  @input="player.setVolume($event.target.value)"
                  class="slider"
                />
              </div>
              <div class="slider-item">
                <label>速率: {{ playbackRate.toFixed(1) }}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.5"
                  :value="playbackRate"
                  @input="player.setPlaybackRate($event.target.value)"
                  class="slider"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  z-index: 1000;
  transition: all 0.3s ease;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
  padding: 20px;
}

.section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 6px;
  font-size: 14px;
}

.info-item label {
  font-weight: 600;
  color: #666;
}

.info-item span {
  color: #333;
  font-family: monospace;
}

/* 控制面板 */
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.ctrl-btn {
  flex: 1;
  padding: 12px 16px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.ctrl-btn.primary {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.ctrl-btn.primary:hover {
  background: #5568d3;
}

.mode-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 6px;
}

.mode-info .icon {
  font-size: 20px;
}

.mode-info .label {
  color: red;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.switch-btn {
  padding: 6px 12px;
  background: #764ba2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.switch-btn:hover {
  background: #6a3f8f;
}

/* 播放列表管理 */
.playlist-mgmt {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn:hover {
  background: #5568d3;
}

.btn.primary {
  background: #667eea;
  width: 100%;
  padding: 12px;
}

.playlists-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: all 0.2s;
}

.playlist-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.playlist-item.active {
  background: #f0f4ff;
  border-color: #667eea;
}

.playlist-info {
  flex: 1;
}

.playlist-info .name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.playlist-info .detail {
  font-size: 12px;
  color: #999;
}

.btn-small {
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-small:hover {
  background: #5568d3;
}

/* 当前曲目和下一首 */
.current-track,
.next-track {
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
}

.track-header {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 8px;
}

.track-info {
  padding: 8px 0;
}

.track-info .title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.track-info .artist {
  font-size: 12px;
  color: #999;
}

/* 队列列表 */
.queue-list {
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.list-header {
  padding: 12px;
  background: #f5f5f5;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #ddd;
}

.tracks-container {
  max-height: 300px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.queue-item:hover {
  background: #f9f9f9;
}

.queue-item.current {
  background: #f0f4ff;
  border-left: 3px solid #667eea;
}

.queue-item .index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
}

.queue-item .track-details {
  flex: 1;
  min-width: 0;
}

.queue-item .track-title {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item .track-artist {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item .duration {
  width: 50px;
  text-align: right;
  font-size: 12px;
  color: #999;
  margin: 0 12px;
}

.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px 10px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #667eea;
}

/* 空状态 */
.empty-state {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

/* 滑块组 */
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-item label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #5568d3;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: #5568d3;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

/* 进度条样式 */
.progress-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-display {
  min-width: 50px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
  text-align: center;
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.2s;
}

.progress-bar-container:hover {
  background: #d0d0d0;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  transition: width 0.05s linear;
}

.progress-bar-fill.dragging {
  transition: none;
}

.progress-slider {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  margin-right: -8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar-container:hover .progress-slider,
.progress-bar-fill.dragging .progress-slider {
  opacity: 1;
}
</style>
