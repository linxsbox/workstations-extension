<script setup>
import PlayerApp from "@/components/player/PlayerApp.vue";
import NotesApp from "@/views/Apps/Notes/AppIndex.vue";
import TaskManagerApp from "@/views/Apps/TaskManager/AppIndex.vue";
import MobileSyncApp from "@/views/Apps/MobileSync/AppIndex.vue";

// 扩展区域：应用快捷入口
// 包括：播放器、笔记、任务管理、手机同步、其他便捷应用等
</script>

<template>
  <div class="extend-box flex flex-wrap gap-2.5">
    <!-- 播放器应用 -->
    <PlayerApp />

    <!-- 笔记应用 -->
    <NotesApp />

    <!-- 任务管理应用 -->
    <TaskManagerApp />
1772251
    <!-- 手机同步应用 -->
    <MobileSyncApp />

    <!-- 其他应用快捷入口可在此添加 -->
  </div>
</template>

<style lang="scss">
// 统一的 APP 图标样式（全局样式，供所有 APP 使用）
.app-icon {
  @apply size-12 relative flex items-center justify-center rounded-lg transition-all cursor-pointer;
  background-color: var(--state-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);

  &:hover {
    background-color: var(--interactive-bg-hover);
    transform: scale(1.05);
  }
}

// 统一的 APP 标签样式
.app-label {
  @apply text-xs font-medium text-center max-w-[60px] whitespace-nowrap overflow-hidden text-ellipsis;
  color: var(--text-secondary);
}
</style>
