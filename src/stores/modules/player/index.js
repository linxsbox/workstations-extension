import { defineStore } from "pinia";
import { storageManager, STORAGE_KEYS } from "../../storage";
import { createAudioManager } from "@/services/audio/manager";
import { PlayMode, PlayModeConfig, Playlist, PlayQueue, ViewMode } from "./types";

const MAX_HISTORY_LENGTH = 50;

// 🔧 临时配置：切换音频后端
// 可选值: 'HTML5Audio' | 'WebAudio' | 'HybridAudio' | null (自动选择)
const PREFERRED_BACKEND = 'HTML5Audio'; // 👈 改这里来切换后端

// 创建音频管理器实例
const audioManager = createAudioManager({
  preferredBackend: PREFERRED_BACKEND
});

export const storePlayer = defineStore("player", {
  state: () => ({
    // 播放状态
    playStatus: {
      isError: false,
      isPlaying: false,
      isLoading: false,
      src: "",
      title: "",
      pid: "",
      album: null,
    },

    // 播放进度
    currentTime: 0,
    duration: 0,

    // 当前主题色
    currentTheme: null, // { color: "#xxx", rgb: "r, g, b" }

    // 控制选项
    volume: storageManager.get(STORAGE_KEYS.VOLUME, 0.8),
    playbackRate: storageManager.getSession(STORAGE_KEYS.PLAYBACK_RATE, 1), // 从 sessionStorage 读取，默认 1

    // 播放队列和循环模式
    playQueue: new PlayQueue(),
    playMode: PlayMode.LOOP,

    // 视图模式
    viewMode: storageManager.get(STORAGE_KEYS.VIEW_MODE, ViewMode.LIST),

    // 播放器显示状态
    isPlayerVisible: false,

    // 后端信息
    backendName: "Unknown",

    // 音频管理器初始化状态
    isAudioManagerInitialized: false,
  }),

  getters: {
    getPlayStatus: (state) => state.playStatus,
    getCurrentTheme: (state) => state.currentTheme,
    getThemeStyle: (state) => {
      if (!state.currentTheme) return {};
      return {
        "--player-color": state.currentTheme.color,
        "--play-button-bg-color": state.currentTheme.rgb,
        "--player-progress-slider": `rgba(${state.currentTheme.rgb}, 0.6)`,
      };
    },
    getPlayQueue: (state) => state.playQueue,
    getPlayMode: (state) => state.playMode,
    getPlayModeConfig: (state) => PlayModeConfig[state.playMode],
    getViewMode: (state) => state.viewMode,
    getIsPlayerVisible: (state) => state.isPlayerVisible,
    isPlayable: (state) => state.playStatus.src && !state.playStatus.isError,
    progressPercent: (state) =>
      state.duration ? (state.currentTime / state.duration) * 100 : 0,
    hasQueue: (state) => state.playQueue.getTrackCount() > 0,
    currentQueueTrack: (state) => state.playQueue.getCurrentTrack(),
    nextQueueTrack: (state) => {
      const nextIndex = state.playQueue.getNextIndex();
      return nextIndex >= 0 ? state.playQueue.tracks[nextIndex] : null;
    },
  },

  actions: {
    /**
     * 生成轨道的稳定 hash ID
     */
    generateTrackHash(track) {
      const key = `${track.src || ''}_${track.title || ''}_${track.artist || ''}`;
      // 简单 hash 算法
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `track_${Math.abs(hash).toString(36)}`;
    },

    /**
     * 初始化音频管理器事件监听
     */
    async initAudioManager() {
      // 防止重复初始化
      if (this.isAudioManagerInitialized) {
        console.warn('[Player] Audio manager already initialized, skipping...');
        return;
      }

      try {
        await audioManager.waitForInit();

        // 加载保存的队列
        this.loadPlayQueue();

        // 时间更新
        audioManager.on("timeupdate", (time) => {
          this.currentTime = time;
        });

        // 播放结束 - 根据模式决定下一步
        audioManager.on("ended", () => {
          this.handlePlayEnded();
        });

        // 错误处理
        audioManager.on("error", (error) => {
          this.playStatus.isError = true;
          this.playStatus.isLoading = false;
          console.error("Audio playback error:", error);
        });

        // 可以播放
        audioManager.on("canplay", () => {
          this.duration = audioManager.getDuration();
          this.playStatus.isLoading = false;
        });

        // 开始加载
        audioManager.on("loadstart", () => {
          this.playStatus.isLoading = true;
          this.playStatus.isError = false;
        });

        // 播放/暂停事件
        audioManager.on("play", () => {
          this.playStatus.isPlaying = true;
        });

        audioManager.on("pause", () => {
          this.playStatus.isPlaying = false;
        });

        this.backendName = audioManager.getBackendName();

        // 标记已初始化
        this.isAudioManagerInitialized = true;
        console.log(`[Player] Audio manager initialized with backend: ${this.backendName}`);
      } catch (error) {
        console.error("Failed to initialize audio manager:", error);
      }
    },

    /**
     * 加载音频
     */
    async loadAudio(src, metadata = {}) {
      console.log('[Player] 开始加载音频:', src, metadata);

      this.playStatus.src = src;
      this.playStatus.title = metadata.title || "";
      this.playStatus.pid = metadata.pid || "";
      this.playStatus.album = metadata.album || null;
      this.playStatus.isError = false;
      this.playStatus.isLoading = true;

      // 提取主题色（如果存在）
      if (metadata.album?.theme) {
        const theme = metadata.album.theme;
        // 如果已经有 color 和 rgb，直接使用
        if (theme.color && theme.rgb) {
          this.currentTheme = theme;
          console.log('[Player] 应用主题色:', theme);
        }
      } else {
        // 没有主题色，清空（使用默认色）
        this.currentTheme = null;
        console.log('[Player] 使用默认主题色');
      }

      try {
        const success = await audioManager.load(src, metadata);
        console.log('[Player] 音频加载结果:', success);

        if (!success) {
          this.playStatus.isError = true;
          this.playStatus.isLoading = false;
          console.error('[Player] 音频加载失败');
          return false;
        }

        return true;
      } catch (error) {
        console.error('[Player] 音频加载异常:', error);
        this.playStatus.isError = true;
        this.playStatus.isLoading = false;
        return false;
      }
    },

    /**
     * 播放
     */
    play() {
      console.log('[Player] 尝试播放, isPlayable:', this.isPlayable, 'playStatus:', this.playStatus);

      if (!this.isPlayable) {
        console.warn('[Player] 无法播放 - isPlayable 为 false');
        return false;
      }

      const success = audioManager.play();
      console.log('[Player] audioManager.play() 结果:', success);

      if (success) {
        this.playStatus.isPlaying = true;
        this.playStatus.isError = false;
      }
      return success;
    },

    /**
     * 暂停
     */
    pause() {
      console.log('[Player] 尝试暂停');

      const success = audioManager.pause();
      console.log('[Player] audioManager.pause() 结果:', success);

      if (success) {
        this.playStatus.isPlaying = false;
      }
      return success;
    },

    /**
     * 停止
     */
    stop() {
      const success = audioManager.stop();
      if (success) {
        this.playStatus.isPlaying = false;
      }
      return success;
    },

    /**
     * 切换播放状态
     */
    togglePlay() {
      if (this.playStatus.isPlaying) {
        return this.pause();
      } else {
        return this.play();
      }
    },

    /**
     * 跳转进度
     */
    seek(time) {
      audioManager.seek(time);
      this.currentTime = time;
    },

    /**
     * 设置音量
     */
    setVolume(volume) {
      const normalizedVolume = Math.max(0, Math.min(1, volume));
      audioManager.setVolume(normalizedVolume);
      this.volume = normalizedVolume;
      storageManager.set(STORAGE_KEYS.VOLUME, normalizedVolume);
    },

    /**
     * 设置播放速率
     */
    setPlaybackRate(rate) {
      const validRate = Math.max(0.5, Math.min(4, rate));
      audioManager.setPlaybackRate(validRate);
      this.playbackRate = validRate;
      // 保存到 sessionStorage，页面刷新保持，但关闭浏览器后重置为 1
      storageManager.setSession(STORAGE_KEYS.PLAYBACK_RATE, validRate);
    },

    /**
     * 重置播放信息
     */
    resetPlayer() {
      this.playStatus = {
        isError: false,
        isPlaying: false,
        isLoading: false,
        src: "",
        title: "",
        pid: "",
        album: null,
      };
      this.currentTime = 0;
      this.duration = 0;
    },

    /**
     * 加入队列 - 添加到队列末尾
     */
    addToQueue(track) {
      const hash = this.generateTrackHash(track);
      if (!this.playQueue.tracks.some((item) => item.id === hash)) {
        const trackWithHash = {
          ...track,
          id: hash,
        };
        this.playQueue.addTrack(trackWithHash);
        this.savePlayQueue();
        return true;
      }
      return false;
    },

    /**
     * 加入播放 - 添加为下一首播放
     */
    addToPlayNext(track) {
      const hash = this.generateTrackHash(track);

      // 如果队列中已存在，先移除
      const existingIndex = this.playQueue.tracks.findIndex((item) => item.id === hash);
      if (existingIndex > -1) {
        this.playQueue.removeTrack(hash);
      }

      // 插入到当前播放索引的下一位
      const nextIndex = this.playQueue.currentIndex + 1;
      this.playQueue.tracks.splice(nextIndex, 0, {
        ...track,
        id: hash,
      });

      this.savePlayQueue();
      return true;
    },

    /**
     * 添加到队列并立即播放
     */
    async addAndPlay(track) {
      const hash = this.generateTrackHash(track);

      // 如果队列中已存在该轨道，先移除
      const existingIndex = this.playQueue.tracks.findIndex((item) => item.id === hash);
      if (existingIndex > -1) {
        this.playQueue.removeTrack(hash);
      }

      // 添加轨道到队列
      const trackWithHash = {
        ...track,
        id: hash,
      };
      this.playQueue.addTrack(trackWithHash);

      // 保存队列
      this.savePlayQueue();

      // 立即跳转到该轨道并播放
      await this.playTrackFromQueue(hash);

      return true;
    },

    /**
     * 清空播放列表
     */
    clearPlaylist() {
      this.playQueue.clear();
      this.savePlayQueue();
    },

    /**
     * 清除错误状态
     */
    clearError() {
      this.playStatus.isError = false;
    },

    // ==================== 播放队列相关方法 ====================

    /**
     * 播放列表中的指定轨道
     */
    async playTrackFromQueue(trackId) {
      console.log('[Player] playTrackFromQueue 调用, trackId:', trackId);
      const track = this.playQueue.jumpToTrack(trackId);
      console.log('[Player] jumpToTrack 返回:', track);
      if (track) {
        await this.loadAudio(track.src, track);
        this.play();
        return true;
      }
      console.warn('[Player] playTrackFromQueue 未找到轨道');
      return false;
    },

    /**
     * 根据 hash 播放队列中的轨道
     */
    playByHash(hashCode) {
      console.log('[Player] 根据 hash 播放:', hashCode);
      console.log('[Player] 当前队列:', this.playQueue.tracks);
      const track = this.playQueue.tracks.find(t => t.id === hashCode);
      if (track) {
        console.log('[Player] 找到轨道:', track);
        return this.playTrackFromQueue(hashCode);
      }
      console.warn('[Player] 未找到 hash 对应的轨道:', hashCode);
      return false;
    },

    /**
     * 下一首
     */
    async playNext() {
      const nextTrack = this.playQueue.next();
      if (nextTrack) {
        await this.loadAudio(nextTrack.src, nextTrack);
        this.play();
        return true;
      }
      return false;
    },

    /**
     * 上一首
     */
    async playPrevious() {
      const prevTrack = this.playQueue.previous();
      if (prevTrack) {
        await this.loadAudio(prevTrack.src, prevTrack);
        this.play();
        return true;
      }
      return false;
    },

    /**
     * 处理播放结束事件
     */
    handlePlayEnded() {
      // 如果是单曲循环，重新播放当前曲目
      if (this.playMode === PlayMode.SINGLE) {
        this.play();
        return;
      }

      // 如果是顺序播放且到了最后，停止
      if (this.playMode === PlayMode.SEQUENTIAL) {
        const nextTrack = this.playQueue.next();
        if (!nextTrack) {
          this.pause();
          return;
        }
      }

      // 其他模式下播放下一首
      this.playNext();
    },

    /**
     * 切换播放模式
     */
    switchPlayMode() {
      const currentConfig = PlayModeConfig[this.playMode];
      const nextMode = currentConfig.next;

      // 如果要切换到随机模式，打乱队列
      if (nextMode === PlayMode.RANDOM && !this.playQueue.isShuffled) {
        this.playQueue.shuffle();
      }
      // 如果要离开随机模式，恢复原始顺序
      else if (this.playMode === PlayMode.RANDOM && nextMode !== PlayMode.RANDOM) {
        this.playQueue.unshuffle();
      }

      this.playMode = nextMode;
      return this.playMode;
    },

    /**
     * 设置播放模式
     */
    setPlayMode(mode) {
      if (!PlayModeConfig[mode]) return false;

      // 如果要切换到随机模式，打乱队列
      if (mode === PlayMode.RANDOM && !this.playQueue.isShuffled) {
        this.playQueue.shuffle();
      }
      // 如果要离开随机模式，恢复原始顺序
      else if (this.playMode === PlayMode.RANDOM && mode !== PlayMode.RANDOM) {
        this.playQueue.unshuffle();
      }

      this.playMode = mode;
      return true;
    },

    /**
     * 从队列移除轨道
     */
    removeFromQueue(trackId) {
      const result = this.playQueue.removeTrack(trackId);
      if (result) {
        this.savePlayQueue();
      }
      return result;
    },

    /**
     * 重新排序队列
     */
    reorderQueue(fromIndex, toIndex) {
      const result = this.playQueue.reorder(fromIndex, toIndex);
      if (result) {
        this.savePlayQueue();
      }
      return result;
    },

    /**
     * 保存播放队列到本地存储
     */
    savePlayQueue() {
      // 确保所有 track 都有 id
      const tracksWithId = this.playQueue.tracks.map(track => ({
        ...track,
        id: track.id || this.generateTrackHash(track)
      }));

      const currentTrack = this.playQueue.getCurrentTrack();
      const currentHash = currentTrack ? currentTrack.id : null;

      storageManager.set(STORAGE_KEYS.PLAY_QUEUE, {
        tracks: tracksWithId,
        currentHash: currentHash,
      });
      console.log('[Player] 队列已保存到本地存储, currentHash:', currentHash);
    },

    /**
     * 从本地存储加载播放队列
     */
    loadPlayQueue() {
      const saved = storageManager.get(STORAGE_KEYS.PLAY_QUEUE);
      console.log('[Player] 从本地存储读取队列:', saved);
      if (saved && saved.tracks) {
        this.playQueue.tracks = saved.tracks || [];

        // 通过 currentHash 找到对应的 index
        if (saved.currentHash) {
          const index = this.playQueue.tracks.findIndex(t => t.id === saved.currentHash);
          this.playQueue.currentIndex = index >= 0 ? index : 0;
          console.log('[Player] 恢复播放位置, currentHash:', saved.currentHash, 'index:', this.playQueue.currentIndex);
        } else {
          this.playQueue.currentIndex = 0;
        }

        console.log('[Player] 已加载队列:', this.playQueue.tracks.length, '首');
        console.log('[Player] 队列详情:', this.playQueue.tracks);
      } else {
        console.log('[Player] 本地存储无队列数据');
      }
    },

    /**
     * 设置视图模式
     */
    setViewMode(mode) {
      if (!ViewMode[mode.toUpperCase()]) {
        console.warn(`Invalid view mode: ${mode}`);
        return false;
      }
      this.viewMode = mode;
      storageManager.set(STORAGE_KEYS.VIEW_MODE, mode);
      return true;
    },

    /**
     * 显示播放器
     */
    showPlayer() {
      this.isPlayerVisible = true;
    },

    /**
     * 隐藏播放器
     */
    hidePlayer() {
      this.isPlayerVisible = false;
    },
  },
});
