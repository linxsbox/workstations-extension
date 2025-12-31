import { defineStore } from "pinia";
import { storageManager, STORAGE_KEYS } from "../../storage";

const MAX_HISTORY_LENGTH = 50; // 最大历史记录数

export const storePlayer = defineStore("player", {
  state: () => ({
    playStatus: {
      isError: false, // 添加播放错误状态
      isPlaying: false, // 播放状态
      isLoading: false, // 音频加载状态
      src: "", // 当前播放的音频源
      title: "", // 当前播放的音频标题
      pid: "", // 源 id
      // pid|author|title|albumTitle|image|theme
      album: null, // 专辑信息 (可选)
    },
    // 播放列表
    playlist: [],
    // 播放历史
    playHistory: storageManager.get(STORAGE_KEYS.PLAY_HISTORY) || [],
  }),

  getters: {
    // 获取当前播放信息
    getPlayStatus: (state) => state.playStatus,
    // 获取播放列表
    getPlaylist: (state) => state.playlist,
    // 获取播放历史
    getPlayHistory: (state) => state.playHistory,
  },

  actions: {
    // 播放
    play(audio) {
      if (!audio) {
        this.playStatus.isPlaying = false; // 播放失败
        return;
      }

      this.playStatus.src = audio.src;
      this.playStatus.title = audio.title;
      this.playStatus.pid = audio.pid;
      this.playStatus.album = audio.album;

      this.playStatus.isPlaying = true;
      this.playStatus.isError = false; // 重置错误状态
    },
    // 暂停
    pause() {
      this.playStatus.isPlaying = false;
    },
    setError() {
      this.playStatus.isError = true;
    },
    // 设置当前播放信息并添加到历史记录
    setCurrentAudio(audio) {
      this.addToHistory(audio);
    },
    // 重置播放信息
    resetPlayer() {
      this.playStatus = {
        isError: false,
        isPlaying: false,
        src: "",
        title: "",
      };
    },

    // 添加到播放历史
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

    // 清空播放历史
    clearHistory() {
      this.playHistory = [];
      storageManager.set(STORAGE_KEYS.PLAY_HISTORY, []);
    },

    // 添加到播放列表
    addToPlaylist(audio) {
      if (!this.playlist.some((item) => item.src === audio.src)) {
        this.playlist.push(audio);
      }
    },

    // 清空播放列表
    clearPlaylist() {
      this.playlist = [];
    },
  },
});
