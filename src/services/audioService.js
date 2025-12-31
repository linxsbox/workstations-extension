class AudioService {
  constructor() {
    this.audioContext = null;
    this.audioSource = null;
    this.analyser = null;
    this.gainNode = null;
    this.audioBuffer = null;
    this.startTime = 0;
    this.pauseTime = 0;
    this.isPlaying = false;
    this.volume = 1;
    this.playbackRate = 1;
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.onError = null;
    this.rafId = null;

    this.init();
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode = this.audioContext.createGain();

      // Set default volume
      this.gainNode.gain.value = this.volume;

      // Connect nodes
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Setup FFT for visualization
      this.analyser.fftSize = 256;

      // Handle tab visibility changes for better performance
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    } catch (error) {
      console.error("Error initializing audio service:", error);
      this.onError?.(error);
    }
  }

  handleVisibilityChange = () => {
    if (document.hidden) {
      // Tab is hidden, reduce processing
      if (this.analyser) {
        this.analyser.fftSize = 64;
      }
    } else {
      // Tab is visible, restore processing
      if (this.analyser) {
        this.analyser.fftSize = 256;
      }
    }
  };

  async load(src) {
    try {
      this.stop();

      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      return true;
    } catch (error) {
      console.error("Error loading audio:", error);
      this.onError?.(error);
      return false;
    }
  }

  play() {
    if (!this.audioBuffer) return false;

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    // Create new source node
    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = this.audioBuffer;
    this.audioSource.playbackRate.value = this.playbackRate;

    // Connect nodes
    this.audioSource.connect(this.analyser);

    // Set up event handlers
    this.audioSource.onended = () => {
      this.isPlaying = false;
      this.onEnded?.();
      this.stopTimeUpdate();
    };

    // Start playing
    const offset = this.pauseTime;
    this.audioSource.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlaying = true;

    // Start time update loop
    this.startTimeUpdate();

    return true;
  }

  pause() {
    if (!this.isPlaying) return;

    this.pauseTime = this.getCurrentTime();
    this.audioSource?.stop();
    this.isPlaying = false;
    this.stopTimeUpdate();
  }

  stop() {
    this.pauseTime = 0;
    this.audioSource?.stop();
    this.isPlaying = false;
    this.stopTimeUpdate();
  }

  seek(time) {
    if (!this.audioBuffer) return;

    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.pause();
    }

    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()));

    if (wasPlaying) {
      this.play();
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.5, Math.min(2, rate));
    if (this.audioSource) {
      this.audioSource.playbackRate.value = this.playbackRate;
    }
  }

  getCurrentTime() {
    if (!this.audioBuffer) return 0;

    if (this.isPlaying && this.audioContext) {
      return this.audioContext.currentTime - this.startTime;
    }

    return this.pauseTime;
  }

  getDuration() {
    return this.audioBuffer?.duration || 0;
  }

  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    return dataArray;
  }

  startTimeUpdate() {
    this.stopTimeUpdate();

    const update = () => {
      if (this.isPlaying && this.onTimeUpdate) {
        this.onTimeUpdate(this.getCurrentTime());
      }
      this.rafId = requestAnimationFrame(update);
    };

    this.rafId = requestAnimationFrame(update);
  }

  stopTimeUpdate() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
    this.stopTimeUpdate();
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );

    if (this.audioContext) {
      if (this.audioContext.state !== "closed") {
        this.audioContext.close();
      }
      this.audioContext = null;
    }

    this.audioSource = null;
    this.analyser = null;
    this.gainNode = null;
    this.audioBuffer = null;
  }
}

export const audioService = new AudioService();

// Register service worker for background playback
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw-audio.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful");
      })
      .catch((err) => {
        console.error("ServiceWorker registration failed: ", err);
      });
  });
}
