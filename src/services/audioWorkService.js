// Service Worker for background audio playback
const CACHE_NAME = "audio-cache-v1";
const CACHE_URLS = [
  "/",
  "/index.html",
  // Add other assets you want to cache
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Background sync for audio playback
self.addEventListener("sync", (event) => {
  if (event.tag === "audio-playback") {
    // Handle any background sync events if needed
  }
});

// Handle background fetch for audio files
self.addEventListener("backgroundfetchsuccess", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open("audio-cache");
      const records = await event.registration.matchAll();

      for (const record of records) {
        const response = await record.responseReady;
        await cache.put(record.request, response);
      }
    })()
  );
});

// Handle media session actions
if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", async () => {
    await self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ action: "play" });
      });
    });
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ action: "pause" });
      });
    });
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ action: "previous" });
      });
    });
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ action: "next" });
      });
    });
  });

  navigator.mediaSession.setActionHandler("seekto", (details) => {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          action: "seekto",
          time: details.seekTime,
        });
      });
    });
  });
}
