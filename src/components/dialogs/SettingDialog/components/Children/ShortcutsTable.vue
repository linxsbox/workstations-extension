<script setup>
import { computed } from "vue";
import { ShortcutAction, getPanelAction } from "@/composables/shortcuts/config";
import { useKeyboardShortcuts } from "@/composables/shortcuts/useKeyboardShortcuts";
import { getPanelKeys, panelConfig } from "@/stores/config/panelConfig";

// 获取快捷键文本函数
const { getShortcutText } = useKeyboardShortcuts();

// 动态生成面板切换快捷键列表
const panelShortcuts = computed(() => {
  const panelKeys = getPanelKeys();
  return panelKeys.map((key, index) => ({
    action: getPanelAction(index),
    description: `切换到${panelConfig[key].label}面板`,
  }));
});

// 快捷键分组（只需要维护 action 和 description）
const shortcutGroups = computed(() => [
  {
    title: "面板切换",
    shortcuts: panelShortcuts.value,
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
]);
</script>

<template>
  <div class="shortcuts-table">
    <div class="text-xs mb-4 p-3 rounded text-[var(--text-tertiary)] bg-[var(--state-hover)]">
      <p>💡 提示：快捷键在输入框中不会触发（Esc 除外）</p>
    </div>
    <div v-for="group in shortcutGroups" :key="group.title" class="shortcut-group mb-6">
      <h3 class="mb-3 text-sm font-medium text-[var(--text-secondary)]">
        {{ group.title }}
      </h3>
      <div class="space-y-2 px-5">
        <div
          v-for="shortcut in group.shortcuts"
          :key="shortcut.action"
          class="shortcut-item flex items-center justify-between py-2 px-3 rounded bg-[var(--state-hover)]"
        >
          <span class="text-sm text-[var(--text-primary)]">
            {{ shortcut.description }}
          </span>
          <kbd
            class="shortcut-key px-2 py-1 text-xs font-mono rounded text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-solid border-[var(--border-color)]"
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
