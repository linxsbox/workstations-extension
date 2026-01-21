<script setup>
import { ShortcutAction } from "@/composables/shortcuts/config";
import { useKeyboardShortcuts } from "@/composables/shortcuts/useKeyboardShortcuts";

// 获取快捷键文本函数
const { getShortcutText } = useKeyboardShortcuts();

// 快捷键分组（只需要维护 action 和 description）
const shortcutGroups = [
  {
    title: "面板切换",
    shortcuts: [
      { action: ShortcutAction.SWITCH_TO_RSS, description: "切换到 RSS 面板" },
      { action: ShortcutAction.SWITCH_TO_TOOLS, description: "切换到工具面板" },
      { action: ShortcutAction.SWITCH_TO_FAVORITES, description: "切换到收藏面板" },
      { action: ShortcutAction.SWITCH_TO_SHARE, description: "切换到分享面板" },
    ],
  },
  {
    title: "小应用模块",
    shortcuts: [
      { action: ShortcutAction.TOGGLE_PLAYER, description: "打开/关闭播放器" },
      { action: ShortcutAction.OPEN_NOTES, description: "打开笔记" },
      { action: ShortcutAction.OPEN_TASKS, description: "打开任务管理" },
      { action: ShortcutAction.OPEN_SEARCH, description: "聚焦搜索框" },
    ],
  },
  {
    title: "通用操作",
    shortcuts: [
      { action: ShortcutAction.TOGGLE_THEME, description: "切换主题模式" },
      { action: ShortcutAction.OPEN_SETTINGS, description: "打开设置" },
    ],
  },
];
</script>

<template>
  <div class="shortcuts-table">
    <div class="text-xs mb-4 p-3 rounded" style="background-color: var(--state-hover); color: var(--text-tertiary)">
      <p>💡 提示：快捷键在输入框中不会触发（Esc 除外）</p>
    </div>
    <div v-for="group in shortcutGroups" :key="group.title" class="shortcut-group mb-6">
      <h3 class="text-sm font-medium mb-3" style="color: var(--text-secondary)">
        {{ group.title }}
      </h3>
      <div class="space-y-2 px-5">
        <div
          v-for="shortcut in group.shortcuts"
          :key="shortcut.action"
          class="shortcut-item flex items-center justify-between py-2 px-3 rounded"
          style="background-color: var(--state-hover)"
        >
          <span class="text-sm" style="color: var(--text-primary)">
            {{ shortcut.description }}
          </span>
          <kbd
            class="shortcut-key px-2 py-1 text-xs font-mono rounded"
            style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color)"
          >
            {{ getShortcutText(shortcut.action) }}
          </kbd>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shortcuts-table {
  .shortcut-group {
    .shortcut-item {
      transition: all 0.2s;

      &:hover {
        background-color: var(--interactive-bg-hover);
      }
    }
  }

  .shortcut-key {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    white-space: nowrap;
  }
}
</style>
