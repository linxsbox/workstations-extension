/**
 * Audio Controls Module
 * Manages playback state and user interactions
 */

export class AudioControls {
  constructor(audioCore, options = {}) {
    if (!audioCore) {
      throw new Error("AudioCore instance is required");
    }

    this.audio = audioCore;
    this.playlist = [];
    this.currentTrackIndex = -1;
    this.isShuffle = false;
    this.isRepeat = false;
    this.volumeBeforeMute = 1;
    this.playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    this.defaultOptions = {
      autoPlay: false,
      muted: false,
      volume: 0.8,
      ...options,
    };

    // Initialize with default options
    this.audio.setVolume(this.defaultOptions.volume);

    if (this.defaultOptions.muted) {
      this.toggleMute();
    }

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle audio ended event
    this.audio.on("ended", () => {
      if (this.isRepeat) {
        this.seekTo(0);
        this.play();
      } else {
        this.next();
      }
    });
  }

  // Playback control methods
  play() {
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  togglePlay() {
    if (this.audio.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  stop() {
    this.audio.stop();
  }

  // Playlist management
  addToPlaylist(track, playNow = false) {
    if (!track || !track.src) return;

    this.playlist.push({
      ...track,
      id:
        track.id ||
        `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    if (playNow || this.playlist.length === 1) {
      this.playTrack(this.playlist.length - 1);
    }

    return this.playlist.length - 1;
  }

  removeFromPlaylist(trackId) {
    const index = this.playlist.findIndex((track) => track.id === trackId);
    if (index !== -1) {
      this.playlist.splice(index, 1);

      if (index === this.currentTrackIndex) {
        this.currentTrackIndex = -1;
        this.stop();
      } else if (index < this.currentTrackIndex) {
        this.currentTrackIndex--;
      }
    }

    return this.playlist;
  }

  clearPlaylist() {
    this.playlist = [];
    this.currentTrackIndex = -1;
    this.stop();
  }

  // Track navigation
  playTrack(index) {
    if (index < 0 || index >= this.playlist.length) return false;

    const track = this.playlist[index];

    this.audio
      .load(track.src)
      .then(() => {
        this.currentTrackIndex = index;
        this.emit("trackchange", track, index);

        if (this.defaultOptions.autoPlay) {
          return this.play();
        }
        return true;
      })
      .catch((error) => {
        console.error("Error loading track:", error);
        this.emit("error", {
          type: "load_error",
          message: "Failed to load track",
          error,
          track,
          index,
        });
      });
  }

  next() {
    if (this.playlist.length === 0) return;

    let nextIndex = this.currentTrackIndex + 1;

    if (this.isShuffle) {
      nextIndex = Math.floor(Math.random() * this.playlist.length);
    } else if (nextIndex >= this.playlist.length) {
      nextIndex = this.isRepeat ? 0 : -1;
    }

    if (nextIndex >= 0) {
      this.playTrack(nextIndex);
    } else {
      this.stop();
      this.emit("playlistend");
    }
  }

  previous() {
    if (this.playlist.length === 0 || this.currentTrackIndex <= 0) return;

    const prevIndex = this.currentTrackIndex - 1;
    this.playTrack(prevIndex);
  }

  // Playback control
  seekTo(time) {
    this.audio.seek(time);
  }

  setVolume(volume) {
    this.audio.setVolume(volume);
  }

  toggleMute() {
    if (this.audio.volume > 0) {
      this.volumeBeforeMute = this.audio.volume;
      this.audio.setVolume(0);
    } else {
      this.audio.setVolume(this.volumeBeforeMute);
    }
  }

  setPlaybackRate(rate) {
    this.audio.setPlaybackRate(rate);
  }

  cyclePlaybackRate() {
    const currentIndex = this.playbackRates.indexOf(this.audio.playbackRate);
    const nextIndex = (currentIndex + 1) % this.playbackRates.length;
    this.setPlaybackRate(this.playbackRates[nextIndex]);
    return this.playbackRates[nextIndex];
  }

  // Getters
  getCurrentTrack() {
    return this.playlist[this.currentTrackIndex] || null;
  }

  getPlaylist() {
    return [...this.playlist];
  }

  getCurrentTime() {
    return this.audio.getCurrentTime();
  }

  getDuration() {
    return this.audio.getDuration();
  }

  getProgress() {
    const currentTime = this.getCurrentTime();
    const duration = this.getDuration();

    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }

  // Event emitter methods
  on(event, listener) {
    this.audio.on(event, listener);
    return this;
  }

  off(event, listener) {
    this.audio.off(event, listener);
    return this;
  }

  once(event, listener) {
    this.audio.once(event, listener);
    return this;
  }

  emit(event, ...args) {
    this.audio.emit(event, ...args);
    return this;
  }

  // Cleanup
  destroy() {
    this.audio.off("ended");
    this.clearPlaylist();
    this.audio = null;
  }
}
