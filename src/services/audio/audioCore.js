/**
 * Core audio processing module
 * Handles basic audio context, loading, and playback
 */

export class AudioCore {
  constructor(options = {}) {
    this.audioContext = null;
    this.audioSource = null;
    this.audioBuffer = null;
    this.isPlaying = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.volume = options.volume || 1;
    this.playbackRate = options.playbackRate || 1;
    this.autoPlay = options.autoPlay !== false;

    this.init();
  }

  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Initialize gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);

      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  }

  async load(src, options = {}) {
    try {
      if (!this.audioContext) {
        if (!this.init()) {
          throw new Error("Audio context initialization failed");
        }
      }

      this.stop();

      // Handle both URL strings and ArrayBuffers
      const arrayBuffer =
        options.arrayBuffer || (await fetch(src).then((r) => r.arrayBuffer()));

      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return true;
    } catch (error) {
      console.error("Error loading audio:", error);
      throw error;
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
    this.audioSource.connect(this.gainNode);

    // Start playing
    const startOffset = this.pauseTime;
    this.audioSource.start(0, startOffset);
    this.startTime = this.audioContext.currentTime - startOffset;
    this.isPlaying = true;

    // Set up ended event
    this.audioSource.onended = () => {
      this.isPlaying = false;
      this.pauseTime = 0;
      this.emit("ended");
    };

    return true;
  }

  pause() {
    if (!this.isPlaying) return;

    this.pauseTime = this.getCurrentTime();
    this.stopSource();
    this.isPlaying = false;
    this.emit("paused");
  }

  stop() {
    this.pauseTime = 0;
    this.stopSource();
    this.isPlaying = false;
    this.emit("stopped");
  }

  seek(time) {
    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.pause();
    }

    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()));

    if (wasPlaying) {
      this.play();
    }

    this.emit("seeked", this.pauseTime);
  }

  setVolume(volume) {
    if (!this.gainNode) return;
    this.volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this.volume;
    this.emit("volumechange", this.volume);
  }

  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.1, Math.min(16, rate));
    if (this.audioSource) {
      this.audioSource.playbackRate.value = this.playbackRate;
    }
    this.emit("ratechange", this.playbackRate);
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

  stopSource() {
    if (this.audioSource) {
      try {
        this.audioSource.onended = null;
        this.audioSource.stop();
      } catch (e) {
        console.warn("Error stopping audio source:", e);
      }
      this.audioSource.disconnect();
      this.audioSource = null;
    }
  }

  destroy() {
    this.stop();

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext) {
      if (this.audioContext.state !== "closed") {
        this.audioContext.close();
      }
      this.audioContext = null;
    }

    this.audioBuffer = null;
    this.removeAllListeners();
  }
}

// Add event emitter methods
["on", "off", "once", "emit", "removeAllListeners"].forEach((method) => {
  AudioCore.prototype[method] = function (...args) {
    if (!this._events) this._events = {};

    if (method === "on" || method === "once") {
      const [event, listener] = args;
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push({
        listener,
        once: method === "once",
      });
    } else if (method === "off") {
      const [event, listenerToRemove] = args;
      if (!this._events[event]) return;
      if (listenerToRemove) {
        this._events[event] = this._events[event].filter(
          ({ listener }) => listener !== listenerToRemove
        );
      } else {
        delete this._events[event];
      }
    } else if (method === "emit") {
      const [event, ...eventArgs] = args;
      if (!this._events[event]) return;

      // Create a copy to handle once removals
      const listeners = [...this._events[event]];

      for (const { listener, once } of listeners) {
        try {
          listener.apply(this, eventArgs);
        } catch (e) {
          console.error(`Error in ${event} handler:`, e);
        }

        if (once) {
          this.off(event, listener);
        }
      }
    } else if (method === "removeAllListeners") {
      const [event] = args;
      if (event) {
        delete this._events[event];
      } else {
        this._events = {};
      }
    }
  };
});
