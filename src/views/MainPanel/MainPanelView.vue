<script setup>
import HeaderBarView from "@/components/common/HeaderBar/HeaderBarView.vue";
import PlayerView from "@/components/player/PlayerView.vue";

import IconArrowUp from "@/components/common/Icons/IconArrowUp.vue";
import IconArrowDown from "@/components/common/Icons/IconArrowDown.vue";

import { storeAside } from "@/stores/modules/aside";
import { storePlayer } from "@/stores/modules/player";

import AudioService from "@/services/audio/index.js";
import { onMounted } from "vue";

const store = storeAside();
const { getActivePanel } = storeToRefs(store);

const showPalyer = ref(false);
const { getPlayStatus } = storeToRefs(storePlayer());

// 只监听一次
const cleanupWatch = watch(
  () => getPlayStatus.value.isPlaying,
  (newVal) => {
    if (newVal) {
      showPalyer.value = true;
      cleanupWatch();
    }
  }
);

onMounted(async () => {
  // const audioService = new AudioService();

  // await audioService.load(
  //   "https://freetyst.nf.migu.cn/public/product9th/product47/2025/04/1714/2016%E5%B9%B401%E6%9C%8812%E6%97%A510%E7%82%B910%E5%88%86%E5%86%85%E5%AE%B9%E5%87%86%E5%85%A5%E7%9B%B8%E4%BF%A1%E9%9F%B3%E4%B9%905024%E9%A6%96/%E6%A0%87%E6%B8%85%E9%AB%98%E6%B8%85/MP3_128_16_Stero/64049300175141353.mp3?channelid=02&msisdn=97e69aaa-81b4-484a-a12d-75988e57ccd8&Tim=1748229296857&Key=18e7d803438f7595"
  // );

  // audioService.play();
});
</script>

<template>
  <div class="main-panel flex-1 flex flex-col overflow-hidden">
    <div class="flex-none p-4 border-b">
      <HeaderBarView />
    </div>

    <div class="panel-box relative flex-1 overflow-hidden">
      <Transition name="panel-switch" mode="out-in">
        <component :is="store.getPanelComponent(getActivePanel)" />
      </Transition>
    </div>

    <footer :class="['footer relative', { show: showPalyer }]">
      <div
        class="show-palyer-button absolute bottom-full w-16 z-1 cursor-pointer"
        @click="showPalyer = !showPalyer"
      >
        <IconArrowUp class="m-auto" v-show="!showPalyer" />
        <IconArrowDown class="m-auto" v-show="showPalyer" />
      </div>
      <PlayerView />
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.main-panel {
  background-color: var(--bg-base);
}

.panel-switch-enter-active,
.panel-switch-leave-active {
  transition: all 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) 0.15s;
}

.panel-switch-leave-to,
.panel-switch-enter-from {
  opacity: 0;
  transform: translateX(15%);
}

.panel-switch-enter-to,
.panel-switch-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.footer {
  --player-bg: var(--interactive-bg-default);
  max-height: 0;
  transform: translate3d(0, 100%, 0);
  transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    max-height 0.1s linear;
  transition-delay: 0s, 0.25s;

  &.show {
    max-height: 90px;
    transform: translate3d(0, 0%, 0);
    transition-delay: 0.1s, 0s;
  }

  .show-palyer-button {
    font-size: 24px;
    color: var(--text-primary);
    background-color: var(--interactive-bg-default);
    border-radius: var(--border-radius-4) var(--border-radius-4) 0 0;
  }
}
</style>
