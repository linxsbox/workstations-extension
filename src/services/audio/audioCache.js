import {
  EVENTS,
  isCacheAPISupported,
  isServiceWorkerSupported,
  DEFAULT_CACHE_NAME,
  DEFAULT_CACHE_SIZE,
} from "./audioUtils.js";
/**
 * Audio Cache Module
 * Handles caching of audio files for offline playback
 */

export class AudioCache {
  constructor(options = {}) {
    this.cacheName = options.cacheName || DEFAULT_CACHE_NAME;
    this.maxCacheSize = options.maxCacheSize || DEFAULT_CACHE_SIZE; // 50MB default
    this.currentCacheSize = 0;
    this.cache = null;
    this.isSupported = isCacheAPISupported && isServiceWorkerSupported;
    this.offlineMode = false;
    this.pendingRequests = new Map();

    if (this.isSupported) {
      this.init();
    }
  }

  async init() {
    try {
      this.cache = await caches.open(this.cacheName);
      await this.calculateCacheSize();
      this.setupServiceWorker();
    } catch (error) {
      console.error("Failed to initialize AudioCache:", error);
      this.isSupported = false;
    }
  }

  setupServiceWorker() {
    if (!isServiceWorkerSupported) return;

    // Register service worker if not already registered
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) {
        navigator.serviceWorker
          .register("/sw-audio.js")
          .then((registration) => {
            console.log("ServiceWorker registration successful");
            // Ensure the service worker is active
            return navigator.serviceWorker.ready;
          })
          .catch((error) => {
            console.error("ServiceWorker registration failed:", error);
            this.isSupported = false;
          });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === EVENTS.CACHE_UPDATED_TYPE) {
        this.emit(EVENTS.CACHE_UPDATED, event.data);
      }
    });
  }

  async calculateCacheSize() {
    if (!this.cache) return 0;

    try {
      const cacheKeys = await this.cache.keys();
      let totalSize = 0;

      for (const request of cacheKeys) {
        const response = await this.cache.match(request);
        if (response) {
          const contentLength = response.headers.get("content-length");
          totalSize += contentLength ? parseInt(contentLength, 10) : 0;
        }
      }

      this.currentCacheSize = totalSize;
      return totalSize;
    } catch (error) {
      console.error("Error calculating cache size:", error);
      return 0;
    }
  }

  async cacheAudio(url, options = {}) {
    if (!this.isSupported || !this.cache) {
      throw new Error("Caching is not supported or not initialized");
    }

    // Check if already in cache
    const cachedResponse = await this.cache.match(url);
    if (cachedResponse) {
      return { fromCache: true, url };
    }

    // Check cache size and clean up if needed
    await this.ensureCacheSpace();

    try {
      // Add to pending requests to prevent duplicate fetches
      if (this.pendingRequests.has(url)) {
        return this.pendingRequests.get(url);
      }

      const fetchPromise = this.fetchAndCache(url, options);
      this.pendingRequests.set(url, fetchPromise);

      const result = await fetchPromise;
      this.pendingRequests.delete(url);

      return result;
    } catch (error) {
      this.pendingRequests.delete(url);
      throw error;
    }
  }

  async fetchAndCache(url, options = {}) {
    try {
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeout || 10000
      );

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: "same-origin",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Clone the response because it can only be consumed once
      const responseToCache = response.clone();

      // Add to cache
      await this.cache.put(url, responseToCache);

      // Update cache size
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        this.currentCacheSize += parseInt(contentLength, 10);
      }

      return { fromCache: false, url };
    } catch (error) {
      console.error("Failed to fetch and cache audio:", error);
      throw error;
    }
  }

  async ensureCacheSpace() {
    if (this.currentCacheSize < this.maxCacheSize) return true;

    try {
      const cacheKeys = await this.cache.keys();

      // Sort by last accessed time (oldest first)
      const sortedKeys = await Promise.all(
        cacheKeys.map(async (request) => {
          const response = await this.cache.match(request);
          const headers = response.headers;
          const lastAccessed = headers.get("last-accessed") || "0";
          return { request, lastAccessed: parseInt(lastAccessed, 10) };
        })
      );

      sortedKeys.sort((a, b) => a.lastAccessed - b.lastAccessed);

      // Remove oldest items until we have enough space
      for (const { request } of sortedKeys) {
        if (this.currentCacheSize < this.maxCacheSize * 0.8) break; // Stop at 80% of max size

        const response = await this.cache.match(request);
        const contentLength = response.headers.get("content-length");

        if (contentLength) {
          this.currentCacheSize -= parseInt(contentLength, 10);
        }

        await this.cache.delete(request);
      }

      return true;
    } catch (error) {
      console.error("Error ensuring cache space:", error);
      return false;
    }
  }

  async getCachedAudio(url) {
    if (!this.isSupported || !this.cache) return null;

    try {
      const response = await this.cache.match(url);
      if (!response) return null;

      // Update last accessed time
      const headers = new Headers(response.headers);
      headers.set("last-accessed", Date.now().toString());

      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });

      // Update cache with new timestamp
      await this.cache.put(url, newResponse.clone());

      return newResponse;
    } catch (error) {
      console.error("Error getting cached audio:", error);
      return null;
    }
  }

  async isCached(url) {
    if (!this.isSupported || !this.cache) return false;
    return (await this.cache.match(url)) !== undefined;
  }

  async removeFromCache(url) {
    if (!this.isSupported || !this.cache) return false;

    try {
      const response = await this.cache.match(url);
      if (!response) return false;

      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        this.currentCacheSize = Math.max(
          0,
          this.currentCacheSize - parseInt(contentLength, 10)
        );
      }

      return await this.cache.delete(url);
    } catch (error) {
      console.error("Error removing from cache:", error);
      return false;
    }
  }

  async clearCache() {
    if (!this.isSupported || !this.cache) return false;

    try {
      await caches.delete(this.cacheName);
      this.currentCacheSize = 0;
      return true;
    } catch (error) {
      console.error("Error clearing cache:", error);
      return false;
    }
  }

  async getCacheInfo() {
    if (!this.isSupported || !this.cache) return null;

    try {
      const cacheKeys = await this.cache.keys();
      const cacheItems = [];
      let totalSize = 0;

      for (const request of cacheKeys) {
        const response = await this.cache.match(request);
        if (response) {
          const contentLength = response.headers.get("content-length") || "0";
          const size = parseInt(contentLength, 10);
          totalSize += size;

          cacheItems.push({
            url: request.url,
            size,
            lastAccessed: response.headers.get("last-accessed") || "0",
            contentType: response.headers.get("content-type") || "audio/mp3",
          });
        }
      }

      return {
        totalItems: cacheItems.length,
        totalSize,
        maxSize: this.maxCacheSize,
        items: cacheItems.sort((a, b) => b.lastAccessed - a.lastAccessed),
      };
    } catch (error) {
      console.error("Error getting cache info:", error);
      return null;
    }
  }

  setOfflineMode(enabled) {
    this.offlineMode = enabled;
    this.emit(EVENTS.OFFLINE_MODE_CHANGE, enabled);
  }

  // Event emitter methods
  on(event, listener) {
    if (!this.listeners) this.listeners = new Map();
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(listener);
    return this;
  }

  off(event, listener) {
    if (!this.listeners || !this.listeners.has(event)) return this;
    this.listeners.get(event).delete(listener);
    return this;
  }

  emit(event, ...args) {
    if (!this.listeners || !this.listeners.has(event)) return;
    for (const listener of this.listeners.get(event)) {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    }
  }

  // Cleanup
  destroy() {
    this.pendingRequests.clear();
    this.listeners = null;
  }

  static get isSupported() {
    return isCacheAPISupported && isServiceWorkerSupported;
  }
}
