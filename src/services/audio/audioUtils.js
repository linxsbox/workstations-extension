/**
 * Audio Utilities
 * Shared functionality and constants for the audio service
 */

// Feature detection
export const isMediaSessionSupported = "mediaSession" in navigator;
export const isServiceWorkerSupported = "serviceWorker" in navigator;
export const isMediaSessionPositionStateSupported =
  "setPositionState" in navigator.mediaSession;
export const isCacheAPISupported = "caches" in window;

// Common event names
export const EVENTS = {
  // Core events
  LOADING: "loading",
  CAN_PLAY: "canplay",
  PLAY: "play",
  PAUSE: "pause",
  ENDED: "ended",
  TIME_UPDATE: "timeupdate",
  VOLUME_CHANGE: "volumechange",
  ERROR: "error",

  // Controls events
  TRACK_CHANGE: "trackchange",
  PLAYLIST_END: "playlistend",

  // Session events
  SEEK: "seek",

  // Cache events
  CACHE_UPDATED: "cacheupdated",
  CACHE_UPDATED_TYPE: "CACHE_UPDATED",
  OFFLINE_MODE_CHANGE: "offlinemodechange",
};

// Media session action names
export const MEDIA_SESSION_ACTIONS = [
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

// Default audio formats to try when loading audio
// Ordered by preference
export const SUPPORTED_AUDIO_FORMATS = [
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/aac",
  "audio/m4a",
  "audio/webm",
];

/**
 * Get MIME type from file extension
 * @param {string} extension - File extension
 * @returns {string} MIME type or empty string if unknown
 */
export function getMimeType(extension) {
  if (!extension) return "";

  const mimeTypes = {
    mp3: "audio/mp3",
    mp4: "audio/mp4",
    m4a: "audio/m4a",
    aac: "audio/aac",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    wav: "audio/wav",
    webm: "audio/webm",
    flac: "audio/flac",
    weba: "audio/webm",
  };

  return mimeTypes[extension.toLowerCase()] || "";
}

export const DEFAULT_CACHE_NAME = "audio-cache-v1";

export const DEFAULT_CACHE_SIZE = 50 * 1024 * 1024; // 50MB default
