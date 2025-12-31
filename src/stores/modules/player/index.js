import { defineStore } from "pinia";
import { storageManager, STORAGE_KEYS } from "../../storage";
import { audioManager } from "@/services/audio/manager";
import { PlayMode, PlayModeConfig, Playlist, PlayQueue } from "./types";

const MAX_HISTORY_LENGTH = 50;

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

    // 控制选项
    volume: storageManager.get(STORAGE_KEYS.VOLUME, 1),
    playbackRate: 1,

    // 播放历史
    playHistory: storageManager.get(STORAGE_KEYS.PLAY_HISTORY) || [],

    // 播放列表
    playlists: storageManager.get(STORAGE_KEYS.PLAYLISTS) || [],
    currentPlaylistId: null,

    // 播放队列和循环模式
    playQueue: new PlayQueue(),
    playMode: PlayMode.LOOP,

    // 后端信息
    backendName: "Unknown",
  }),

  getters: {
    getPlayStatus: (state) => state.playStatus,
    getPlaylists: (state) => state.playlists,
    getCurrentPlaylist: (state) => {
      if (!state.currentPlaylistId) return null;
      return state.playlists.find(p => p.id === state.currentPlaylistId);
    },
    getPlayQueue: (state) => state.playQueue,
    getPlayMode: (state) => state.playMode,
    getPlayModeConfig: (state) => PlayModeConfig[state.playMode],
    getPlayHistory: (state) => state.playHistory,
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
     * 初始化音频管理器事件监听
     */
    async initAudioManager() {
      try {
        await audioManager.waitForInit();

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
        console.log(`Player initialized with backend: ${this.backendName}`);
      } catch (error) {
        console.error("Failed to initialize audio manager:", error);
      }
    },

    /**
     * 加载音频
     */
    async loadAudio(src, metadata = {}) {
      this.playStatus.src = src;
      this.playStatus.title = metadata.title || "";
      this.playStatus.pid = metadata.pid || "";
      this.playStatus.album = metadata.album || null;

      const success = await audioManager.load(src, metadata);
      if (!success) {
        this.playStatus.isError = true;
      }
    },

    /**
     * 播放
     */
    play() {
      if (!this.isPlayable) return false;

      const success = audioManager.play();
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
      const success = audioManager.pause();
      if (success) {
        this.playStatus.isPlaying = false;
      }
      return success;
    },

    /**
     * 停止
     */
    stop() {
      return audioManager.stop();
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
    },

    /**
     * 设置当前播放信息并添加到历史记录
     */
    setCurrentAudio(audio) {
      this.addToHistory(audio);
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
     * 添加到播放历史
     */
    addToHistory(audio) {
      this.playHistory = this.playHistory.filter(
        (item) => item.src !== audio.src
      );
      this.playHistory.unshift({
        ...audio,
        playedAt: new Date().toISOString(),
      });
      if (this.playHistory.length > MAX_HISTORY_LENGTH) {
        this.playHistory = this.playHistory.slice(0, MAX_HISTORY_LENGTH);
      }
      storageManager.set(STORAGE_KEYS.PLAY_HISTORY, this.playHistory);
    },

    /**
     * 清空播放历史
     */
    clearHistory() {
      this.playHistory = [];
      storageManager.set(STORAGE_KEYS.PLAY_HISTORY, []);
    },

    /**
     * 添加到播放列表
     */
    addToPlaylist(audio) {
      if (!this.playQueue.tracks.some((item) => item.src === audio.src)) {
        this.playQueue.addTrack(audio);
      }
    },

    /**
     * 清空播放列表
     */
    clearPlaylist() {
      this.playQueue.clear();
    },

    /**
     * 清除错误状态
     */
    clearError() {
      this.playStatus.isError = false;
    },

    // ==================== 播放队列相关方法 ====================

    /**
     * 创建播放列表
     */
    createPlaylist(name, description = "") {
      const playlist = new Playlist({
        name,
        description,
      });
      this.playlists.push(playlist);
      this.savePlaylists();
      return playlist;
    },

    /**
     * 删除播放列表
     */
    deletePlaylist(playlistId) {
      const index = this.playlists.findIndex(p => p.id === playlistId);
      if (index > -1) {
        this.playlists.splice(index, 1);
        if (this.currentPlaylistId === playlistId) {
          this.currentPlaylistId = null;
        }
        this.savePlaylists();
        return true;
      }
      return false;
    },

    /**
     * 获取播放列表
     */
    getPlaylistById(playlistId) {
      return this.playlists.find(p => p.id === playlistId);
    },

    /**
     * 添加轨道到播放列表
     */
    addTrackToPlaylist(playlistId, track) {
      const playlist = this.getPlaylistById(playlistId);
      if (playlist && playlist.addTrack(track)) {
        this.savePlaylists();
        return true;
      }
      return false;
    },

    /**
     * 从播放列表移除轨道
     */
    removeTrackFromPlaylist(playlistId, trackId) {
      const playlist = this.getPlaylistById(playlistId);
      if (playlist && playlist.removeTrack(trackId)) {
        this.savePlaylists();
        return true;
      }
      return false;
    },

    /**
     * 从播放列表初始化队列
     */
    initQueueFromPlaylist(playlistId) {
      const playlist = this.getPlaylistById(playlistId);
      if (!playlist) return false;

      this.playQueue = PlayQueue.fromPlaylist(playlist, this.playMode);
      this.currentPlaylistId = playlistId;

      // 加载第一首
      const firstTrack = this.playQueue.getCurrentTrack();
      if (firstTrack) {
        this.loadAudio(firstTrack.src, firstTrack);
      }

      return true;
    },

    /**
     * 播放列表中的指定轨道
     */
    playTrackFromQueue(trackId) {
      const track = this.playQueue.jumpToTrack(trackId);
      if (track) {
        this.loadAudio(track.src, track);
        this.play();
        return true;
      }
      return false;
    },

    /**
     * 下一首
     */
    playNext() {
      const nextTrack = this.playQueue.next();
      if (nextTrack) {
        this.loadAudio(nextTrack.src, nextTrack);
        this.play();
        return true;
      }
      return false;
    },

    /**
     * 上一首
     */
    playPrevious() {
      const prevTrack = this.playQueue.previous();
      if (prevTrack) {
        this.loadAudio(prevTrack.src, prevTrack);
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
      return this.playQueue.removeTrack(trackId);
    },

    /**
     * 重新排序队列
     */
    reorderQueue(fromIndex, toIndex) {
      return this.playQueue.reorder(fromIndex, toIndex);
    },

    /**
     * 保存播放列表到存储
     */
    savePlaylists() {
      storageManager.set(STORAGE_KEYS.PLAYLISTS, this.playlists);
    },
  },
});
