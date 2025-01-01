<script setup>
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
});

const emit = defineEmits(["update:show", "import", "copy"]);

const message = useMessage();

const importUrl = ref("");

const handleImport = () => {
  emit("import", importUrl.value);
};

const handleCopy = () => {
  clipboard({
    data: props.exportData,
    success: (msg) => {
      emit("copy", props.exportData);
      message.success(msg);
    },
    error: (msg) => {
      message.error(msg);
    },
  });
};

const handleUpdateShow = (val) => {
  emit("update:show", val);
};
</script>

<template>
  <NModal
    :show="props.show"
    preset="dialog"
    :title="props.title"
    @update:show="handleUpdateShow"
  >
    <section v-if="importType === 1">
      <slot name="import"></slot>
      <div class="text-right">
        <NButton
          class="mt-2"
          type="primary"
          size="small"
          :loading="loading"
          @click="handleImport"
        >
          导入
        </NButton>
      </div>
    </section>

    <section v-else>
      <div class="flex justify-between items-centermb-2">
        <slot name="export"></slot>
        <NButton
          class="ml-2"
          type="primary"
          size="small"
          @click="handleCopy"
          v-if="isCopy"
        >
          复制
        </NButton>
      </div>
      <NScrollbar class="max-h-[680px]">
        <div class="whitespace-pre" v-if="exportData">
          {{ exportData }}
        </div>
        <NEmpty class="pt-10 mx-auto" v-else description="暂无导出数据" />
      </NScrollbar>
    </section>
  </NModal>
</template>
