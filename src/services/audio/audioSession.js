import {
  isMediaSessionSupported,
  isMediaSessionPositionStateSupported,
} from "./audioUtils.js";
/**
 * Audio Session Module
 * Handles media session integration and background playback
 */

export class AudioSession {
  constructor(audioControls, options = {}) {
    if (!audioControls) {
      throw new Error("AudioControls instance is required");
    }

    this.controls = audioControls;
    this.isSupported = isMediaSessionSupported;
    this.positionState = null;
    this.defaultOptions = {
      artwork: [],
      title: "Unknown Track",
      artist: "Unknown Artist",
      album: "",
      ...options,
    };

    if (this.isSupported) {
      this.setupMediaSession();
    }
  }

  setupMediaSession() {
    if (!this.isSupported) return;

    // Set initial metadata
    this.updateMetadata({
      title: this.defaultOptions.title,
      artist: this.defaultOptions.artist,
      album: this.defaultOptions.album,
      artwork: this.defaultOptions.artwork,
    });

    // Set up action handlers
    const actionHandlers = [
      ["play", () => this.controls.play()],
      ["pause", () => this.controls.pause()],
      ["stop", () => this.controls.stop()],
      ["seekbackward", (details) => this.handleSeekBackward(details)],
      ["seekforward", (details) => this.handleSeekForward(details)],
      ["seekto", (details) => this.handleSeekTo(details)],
      ["previoustrack", () => this.controls.previous()],
      ["nexttrack", () => this.controls.next()],
      ["skipad", () => {}],
      ["togglemute", () => this.controls.toggleMute()],
      ["toggleplay", () => this.controls.togglePlay()],
    ];

    // Set up each action handler
    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.warn(`The media session action "${action}" is not supported`);
      }
    }

    // Update playback state when it changes
    this.controls.on("play", () => {
      navigator.mediaSession.playbackState = "playing";
      this.updatePositionState();
    });

    this.controls.on("pause", () => {
      navigator.mediaSession.playbackState = "paused";
    });

    this.controls.on("ended", () => {
      navigator.mediaSession.playbackState = "none";
    });

    // Update position state periodically
    this.controls.on("timeupdate", () => {
      this.updatePositionState();
    });

    // Update metadata when track changes
    this.controls.on("trackchange", (track) => {
      this.updateMetadata({
        title: track.title || this.defaultOptions.title,
        artist: track.artist || this.defaultOptions.artist,
        album: track.album || this.defaultOptions.album,
        artwork: track.artwork || this.defaultOptions.artwork,
      });
    });
  }

  updateMetadata(metadata) {
    if (!this.isSupported) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: this.formatArtwork(metadata.artwork),
      });
    } catch (error) {
      console.warn("Failed to update media session metadata:", error);
    }
  }

  updatePositionState() {
    if (!this.isSupported || !isMediaSessionPositionStateSupported) return;

    const positionState = {
      duration: this.controls.getDuration(),
      playbackRate: this.controls.audio.playbackRate,
      position: this.controls.getCurrentTime(),
    };

    // Only update if something changed
    if (JSON.stringify(this.positionState) !== JSON.stringify(positionState)) {
      this.positionState = positionState;
      navigator.mediaSession.setPositionState(positionState);
    }
  }

  handleSeekBackward(details) {
    const skipTime = details.seekOffset || 10; // Default 10 seconds
    const newTime = Math.max(0, this.controls.getCurrentTime() - skipTime);
    this.controls.seekTo(newTime);
  }

  handleSeekForward(details) {
    const skipTime = details.seekOffset || 10; // Default 10 seconds
    const newTime = Math.min(
      this.controls.getDuration(),
      this.controls.getCurrentTime() + skipTime
    );
    this.controls.seekTo(newTime);
  }

  handleSeekTo(details) {
    if (typeof details.seekTime === "number") {
      this.controls.seekTo(details.seekTime);
    } else if (details.fastSeek && "fastSeek" in this.controls.audio) {
      this.controls.audio.fastSeek(details.seekTime);
    } else {
      this.controls.seekTo(details.seekTime);
    }
  }

  formatArtwork(artwork) {
    if (!artwork) return [];
    if (Array.isArray(artwork)) return artwork;

    // Convert single artwork to array if needed
    return [
      {
        src: typeof artwork === "string" ? artwork : artwork.src,
        sizes: artwork.sizes || "192x192",
        type: artwork.type || "image/png",
      },
    ];
  }

  // Set custom action handler
  setActionHandler(action, handler) {
    if (!this.isSupported) return false;

    try {
      navigator.mediaSession.setActionHandler(action, handler);
      return true;
    } catch (error) {
      console.warn(`The media session action "${action}" is not supported`);
      return false;
    }
  }

  // Set playback state (useful for remote controls)
  setPlaybackState(state) {
    if (!this.isSupported) return;

    const validStates = ["none", "paused", "playing"];
    if (validStates.includes(state)) {
      navigator.mediaSession.playbackState = state;
    }
  }

  // Clean up
  destroy() {
    if (!this.isSupported) return;

    // Clear all action handlers
    const actions = [
      "play",
      "pause",
      "stop",
      "seekbackward",
      "seekforward",
      "seekto",
      "previoustrack",
      "nexttrack",
      "skipad",
      "togglemute",
      "toggleplay",
    ];

    actions.forEach((action) => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch (error) {
        // Ignore errors when clearing handlers
      }
    });

    // Clear metadata
    navigator.mediaSession.metadata = null;
    this.controls = null;
  }
}

// Add static properties
AudioSession.SUPPORTED_ACTIONS = [
  "play",
  "pause",
  "stop",
  "seekbackward",
  "seekforward",
  "seekto",
  "previoustrack",
  "nexttrack",
  "skipad",
  "togglemute",
  "toggleplay",
];
