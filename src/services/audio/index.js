/**
 * Audio Service
 * A modular audio service for web applications
 */

import { AudioCore } from "./audioCore.js";
import { AudioControls } from "./audioControls.js";
import { AudioSession } from "./audioSession.js";
import { AudioCache } from "./audioCache.js";
import { DEFAULT_CACHE_NAME, DEFAULT_CACHE_SIZE } from "./audioUtils.js";

/**
 * Main AudioService class that combines all audio modules
 */
export class AudioService {
  constructor(options = {}) {
    // Initialize core audio
    this.core = new AudioCore({
      autoResume: options.autoResume !== false,
      autoResumeDelay: options.autoResumeDelay || 1000,
      ...options.core,
    });

    // Initialize controls
    this.controls = new AudioControls(this.core, {
      autoPlay: options.autoPlay || false,
      muted: options.muted || false,
      volume: options.volume || 0.8,
      ...options.controls,
    });

    // Initialize session (media controls, etc.)
    this.session = new AudioSession(this.controls, {
      title: options.title || "Audio Player",
      artist: options.artist || "",
      album: options.album || "",
      artwork: options.artwork || [],
      ...options.session,
    });

    // Initialize cache if supported
    if (AudioCache.isSupported) {
      this.cache = new AudioCache({
        cacheName: options.cacheName || DEFAULT_CACHE_NAME,
        maxCacheSize: options.maxCacheSize || DEFAULT_CACHE_SIZE,
        ...options.cache,
      });
    }

    // Store options for later use
    this.options = options;
  }

  /**
   * Load audio from a URL or source object
   * @param {string|Object} source - URL or source object with metadata
   * @param {boolean} useCache - Whether to use cache if available
   * @returns {Promise<string>} The URL of the loaded audio
   */
  async load(source, useCache = true) {
    try {
      let url = typeof source === "string" ? source : source.src;

      // Try to get from cache if enabled and available
      if (useCache && this.cache) {
        const cached = await this.cache.getCachedAudio(url);
        if (cached) {
          // Use cached audio
          url = URL.createObjectURL(await cached.blob());
        } else if (this.cache.offlineMode) {
          throw new Error("Audio not available in offline mode");
        } else if (this.options.cacheOnPlay !== false) {
          // Cache in background if not already cached
          this.cache.cacheAudio(url).catch(console.error);
        }
      }

      // Load the audio
      await this.core.load(url);

      // Update session metadata if source has metadata
      if (typeof source === "object" && this.session) {
        this.session.updateMetadata({
          title: source.title,
          artist: source.artist,
          album: source.album,
          artwork: source.artwork,
        });
      }

      return url;
    } catch (error) {
      console.error("Error loading audio:", error);
      throw error;
    }
  }

  /**
   * Play the currently loaded audio
   * @returns {Promise<boolean>} Resolves to true if playback started successfully
   */
  play() {
    try {
      this.controls.play();
      return true;
    } catch (error) {
      console.error("Error starting playback:", error);
      throw error;
    }
  }

  /**
   * Load and play audio in one call
   * @param {string|Object} source - URL or source object with metadata
   * @param {boolean} useCache - Whether to use cache if available
   * @returns {Promise<boolean>} Resolves when audio starts playing
   */
  async autoPlay(source, useCache = true) {
    await this.load(source, useCache);
    return this.play();
  }

  /**
   * Pause playback
   */
  pause() {
    this.controls.pause();
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    this.controls.togglePlay();
  }

  /**
   * Stop playback and reset position
   */
  stop() {
    this.controls.stop();
  }

  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   */
  seek(time) {
    this.controls.seekTo(time);
  }

  /**
   * Set volume (0-1)
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.controls.setVolume(volume);
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.controls.toggleMute();
  }

  /**
   * Set playback rate (0.5-4)
   * @param {number} rate - Playback rate (0.5-4)
   */
  setPlaybackRate(rate) {
    this.controls.setPlaybackRate(rate);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }

    if (this.controls) {
      this.controls.destroy();
      this.controls = null;
    }

    if (this.core) {
      this.core.destroy();
      this.core = null;
    }

    if (this.cache) {
      this.cache.destroy();
      this.cache = null;
    }
  }
}

// Export all modules for individual use
export { AudioCore, AudioControls, AudioSession, AudioCache };

// Export default instance
export default AudioService;
