import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "assets/style.css";
import "assets/index.scss";
import { storePlayer } from "@/stores/modules/player";
import { isExtensionEnvironment } from "@/services/player/bridge";

const pinia = createPinia();

createApp(App).use(pinia).mount("#app");

// 在扩展环境下处理播放交接
if (isExtensionEnvironment()) {
  console.log('[Main] Extension environment detected');

  // 页面打开时，检查是否需要从 Offscreen 接管播放
  window.addEventListener('load', async () => {
    console.log('[Main] Page loaded, checking for offscreen playback');
    const playerStore = storePlayer();
    await playerStore.takeoverPlayback();
  });

  // 页面关闭时，如果正在播放则交接到 Offscreen
  window.addEventListener('beforeunload', async (event) => {
    console.log('[Main] Page unloading, checking playback status');
    const playerStore = storePlayer();

    if (playerStore.playStatus.isPlaying) {
      console.log('[Main] Playback active, handing over to offscreen');
      await playerStore.handoverPlayback();
    }
  });
}
