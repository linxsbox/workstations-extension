<script setup>
const props = defineProps({
  offset: { type: Number, default: 100 },
  isPlay: { type: Boolean, default: false },
  isDisabled: { type: Boolean, default: false },
});
const emits = defineEmits(["play", "pause"]);
const playStatus = ref(props.isPlay);

// 监听 isPlay 的变化
watch(() => props.isPlay, (newVal) => {
  playStatus.value = newVal; // 更新 playStatus
});

const handleClick = () => {
  if (props.isDisabled) return
  playStatus.value = !playStatus.value;
  emits(playStatus.value ? "play" : "pause");
};

const handleReset = () => {
  playStatus.value = false;
};

defineExpose({
  reset: handleReset,
});
</script>

<template>
  <button class="play-button" :aria-label="playStatus ? '暂停' : '播放'" type="button" @click="handleClick">
    <svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" v-if="!playStatus">
      <circle cx="16" cy="16" r="16" fill="rgba(var(--play-button-bg-color, var(--play-button-bg-default)), 0.1)">
      </circle>
      <path d="M23.25 15.567a.5.5 0 010 .866l-10.5 6.062a.5.5 0 01-.75-.433V9.938a.5.5 0 01.75-.433l10.5 6.062z"
        fill="currentColor"></path>
    </svg>

    <svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" style="overflow: visible; position: relative" v-else>
      <circle cx="16" cy="16" r="15" stroke="#747480" stroke-opacity="0.08" stroke-width="2.5"></circle>
      <circle cx="16" cy="16" r="15" stroke-width="2.5" origin="50%, 50%" stroke="currentColor"
        :stroke-dashoffset="props.offset" stroke-dasharray="100" stroke-linecap="round" stroke-linejoin="round"
        style="transform: rotate(-90deg); transform-origin: center center"></circle>
      <rect x="12" y="9" width="3" height="14" rx="0.5" fill="currentColor"></rect>
      <rect x="18" y="9" width="3" height="14" rx="0.5" fill="currentColor"></rect>
    </svg>
  </button>
</template>

<style lang="scss" scoped>
.play-button {
  --play-button-bg-default: "255,255,255";
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
}
</style>
