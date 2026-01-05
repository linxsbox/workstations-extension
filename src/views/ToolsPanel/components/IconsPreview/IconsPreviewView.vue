<script setup>
import { ref, computed, shallowRef } from 'vue';
import { NInput, NScrollbar, useMessage } from 'naive-ui';
import { clipboard } from '@linxs/toolkit';

const message = useMessage();

// 使用 eager 模式立即加载所有图标组件
const iconModules = import.meta.glob('../../../../components/common/Icons/*.vue', { eager: true });

// 提取图标列表（使用 shallowRef 避免深度响应式）
const iconList = shallowRef(
  Object.keys(iconModules).map((path) => {
    // 从路径中提取文件名
    const fileName = path.split('/').pop().replace('.vue', '');
    return {
      name: fileName,
      component: markRaw(iconModules[path].default),
    };
  }).sort((a, b) => a.name.localeCompare(b.name))
);

// 搜索关键词
const searchKeyword = ref('');

// 过滤后的图标列表
const filteredIcons = computed(() => {
  if (!searchKeyword.value.trim()) {
    return iconList.value;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return iconList.value.filter((icon) =>
    icon.name.toLowerCase().includes(keyword)
  );
});

// 复制图标名称
const handleCopyIconName = (iconName) => {
  clipboard({
    data: iconName,
    success: () => message.success(`已复制：${iconName}`),
    error: () => message.error('复制失败'),
  });
};

// 复制使用代码
const handleCopyUsageCode = (iconName) => {
  const code = `<${iconName} class="text-2xl" />`;
  clipboard({
    data: code,
    success: () => message.success('已复制使用代码'),
    error: () => message.error('复制失败'),
  });
};
</script>

<template>
  <div class="icons-preview-container flex flex-col h-full">
    <!-- 工具栏 -->
    <div class="toolbar flex-none flex items-center gap-4 p-4 border-b border-[var(--border-color)]">
      <!-- 搜索框 -->
      <NInput
        v-model:value="searchKeyword"
        placeholder="搜索图标名称..."
        clearable
        class="flex-1"
      />

      <!-- 统计 -->
      <div class="text-sm text-[var(--text-color-3)]">
        {{ filteredIcons.length }} / {{ iconList.length }}
      </div>
    </div>

    <!-- 图标网格 -->
    <NScrollbar class="flex-1">
      <div class="icons-grid p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <div
          v-for="icon in filteredIcons"
          :key="icon.name"
          class="icon-card flex flex-col items-center gap-2 p-3 rounded-lg border border-[var(--border-color)] cursor-pointer transition-colors hover:bg-[var(--hover-color)]"
          @click="handleCopyIconName(icon.name)"
          @dblclick.stop="handleCopyUsageCode(icon.name)"
          :title="`单击复制名称，双击复制使用代码`"
        >
          <!-- 图标预览 -->
          <div class="icon-preview flex items-center justify-center min-h-[48px]">
            <component
              :is="icon.component"
              class="text-4xl text-[var(--text-color-1)]"
            />
          </div>

          <!-- 图标名称 -->
          <div class="icon-name text-xs text-center text-[var(--text-color-2)] break-all leading-tight">
            {{ icon.name }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredIcons.length === 0"
        class="flex flex-col items-center justify-center h-[400px] text-[var(--text-color-3)]"
      >
        <p class="text-lg">未找到匹配的图标</p>
      </div>
    </NScrollbar>
  </div>
</template>

<style lang="scss" scoped>
.icons-preview-container {
  background-color: var(--ui-common-bg);
}

.icon-card {
  min-height: 90px;
  user-select: none;

  &:active {
    transform: scale(0.98);
  }
}
</style>
