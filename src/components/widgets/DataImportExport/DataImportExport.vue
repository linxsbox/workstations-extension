<script setup>
import { ref } from "vue";
import { NButton, NScrollbar, NEmpty, NModal, useMessage } from "naive-ui";
import { clipboard } from "@linxs/toolkit";

const props = defineProps({
  show: { type: Boolean, default: false },
  // 0 导出 | 1 导入
  importType: { type: Number, default: 0 },
  exportData: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  isCopy: { type: Boolean, default: true },
  title: { type: String, default: "" },
  // 钩子函数
  beforeImport: { type: Function, default: null },
  afterImport: { type: Function, default: null },
  beforeExport: { type: Function, default: null },
  afterExport: { type: Function, default: null },
  beforeCopy: { type: Function, default: null },
  afterCopy: { type: Function, default: null },
});

const emit = defineEmits(["update:show", "import", "export", "copy"]);

const message = useMessage();

const importData = ref("");

// 处理导入
const handleImport = async () => {
  try {
    // beforeImport 钩子
    if (props.beforeImport) {
      const result = await props.beforeImport(importData.value);
      if (result === false) return; // 返回 false 则取消导入
    }

    emit("import", importData.value);

    // afterImport 钩子
    if (props.afterImport) {
      await props.afterImport(importData.value);
    }
  } catch (error) {
    console.error("导入失败:", error);
    message.error(`导入失败: ${error.message}`);
  }
};

// 处理复制
const handleCopy = async () => {
  try {
    // beforeCopy 钩子
    if (props.beforeCopy) {
      const result = await props.beforeCopy(props.exportData);
      if (result === false) return;
    }

    clipboard({
      data: props.exportData,
      success: (msg) => {
        emit("copy", props.exportData);
        message.success(msg);

        // afterCopy 钩子
        if (props.afterCopy) {
          props.afterCopy(props.exportData);
        }
      },
      error: (msg) => {
        message.error(msg);
      },
    });
  } catch (error) {
    console.error("复制失败:", error);
    message.error(`复制失败: ${error.message}`);
  }
};

const handleUpdateShow = (val) => {
  emit("update:show", val);
};
</script>

<template>
  <NModal
    :show="props.show"
    :title="props.title"
    preset="dialog"
    @update:show="handleUpdateShow"
  >
    <!-- 导入模式 -->
    <section v-if="importType === 1">
      <!-- 自定义导入内容区域 -->
      <slot name="import-content" :data="importData"></slot>

      <!-- 自定义按钮区域 -->
      <div class="text-right mt-2">
        <slot
          name="import-actions"
          :handleImport="handleImport"
          :loading="loading"
        >
        </slot>
        <NButton
          type="primary"
          size="small"
          :loading="loading"
          @click="handleImport"
        >
          导入
        </NButton>
      </div>
    </section>

    <!-- 导出模式 -->
    <section v-else>
      <!-- 自定义导出头部区域 -->
      <div class="flex flex-wrap items-center gap-3 mb-2">
        <!-- 自定义按钮区域 -->
        <slot name="export-actions"></slot>
        <NButton
          class=""
          type="primary"
          size="small"
          @click="handleCopy"
          v-if="isCopy"
        >
          复制
        </NButton>
      </div>

      <!-- 自定义内容显示区域 -->
      <NScrollbar class="max-h-[680px]">
        <slot name="export-content" :data="exportData">
          <div class="whitespace-pre" v-if="exportData">
            {{ exportData }}
          </div>
          <NEmpty class="pt-10 mx-auto" v-else description="暂无导出数据" />
        </slot>
      </NScrollbar>
    </section>
  </NModal>
</template>
