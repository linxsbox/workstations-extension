<script setup>
import PlayerApp from "@/components/player/PlayerApp.vue";

// 扩展区域：应用快捷入口
// 包括：播放器、笔记、其他便捷应用等
</script>

<template>
  <div class="extend-box flex flex-wrap gap-2.5">
    <!-- 播放器应用 -->
    <PlayerApp />

    <!-- 其他应用快捷入口可在此添加 -->
  </div>
</template>

<style lang="scss" scoped></style>
