<script setup>
import { NFormItem, NInput, NPopover, useMessage } from "naive-ui";
import { defaultStorage, debounce } from "@linxs/toolkit";
import IconHelp from "@/components/common/Icons/IconHelp.vue";

const message = useMessage();
const { localStorage } = defaultStorage();

const apiInput = ref("");
const isLoading = ref(false);

const APIKEYS = "APIKEYS";

const handleChange = (value = "") => {
  isLoading.value = true;

  const timer = setTimeout(() => {
    localStorage.set(APIKEYS, { DeepSeekAPIKey: value.trim() });
    message.success("API Key已设置");
    isLoading.value = false;

    clearTimeout(timer);
  }, 500);
};

onMounted(() => {
  apiInput.value = localStorage.get(APIKEYS)
    ? localStorage.get(APIKEYS).DeepSeekAPIKey
    : "";
});
</script>

<template>
  <NFormItem>
    <template #label>
      <div class="flex items-center gap-2">
        DeepSeek
        <NPopover placement="top-start" trigger="click">
          <template #trigger>
            <IconHelp />
          </template>
          <div>目前只支持 DeepSeek API</div>
        </NPopover>
      </div>
    </template>

    <NInput
      v-model:value="apiInput"
      @change="handleChange"
      placeholder="请输入 API Key"
      :loading="isLoading"
    />
  </NFormItem>
</template>
