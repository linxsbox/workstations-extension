<script setup>
import { ref, computed, onMounted } from "vue";
import {
  NForm,
  NFormItem,
  NButton,
  NInput,
  NRadioGroup,
  NRadio,
  NCheckbox,
  NCheckboxGroup,
  useMessage,
} from "naive-ui";
import { debounce, delay } from "@linxs/toolkit";
import { storeRss } from "@/stores/modules/rss";
import {
  RssSourceTypeEnum,
  RSS_SOURCE_TYPES,
  PRESET_RSS_OPTIONS,
} from "@/stores/modules/rss/config";
import { storeAside } from "@/stores/modules/aside";
import { storeTab } from "@/stores/modules/tab";
import { DEFAULT_PANEL } from "@/stores/config";

const store = storeRss();
const message = useMessage();

const formRef = ref(null);
const loading = ref(false);
const formValue = ref({
  type: RssSourceTypeEnum.RSS,
  name: "",
  sourceUrl: "",
  xiaoyuzhouUrl: "",
  searchQuery: "",
  presetSelected: [], // 存储选中的预设源
});

const showNameField = computed(
  () => formValue.value.type === RssSourceTypeEnum.RSS
);
const showRssUrlField = computed(
  () => formValue.value.type === RssSourceTypeEnum.RSS
);
const showXiaoyuzhouUrlField = computed(
  () => formValue.value.type === RssSourceTypeEnum.XIAOYUZHOU
);
const showPresetSelect = computed(
  () => formValue.value.type === RssSourceTypeEnum.PRESET
);
const showSearchField = computed(
  () => formValue.value.type === RssSourceTypeEnum.WECHAT
);

const rules = {
  sourceUrl: {
    required: computed(() => showRssUrlField.value),
    message: "请输入 RSS 源地址",
    trigger: ["blur", "input"],
  },
  xiaoyuzhouUrl: {
    required: computed(() => showXiaoyuzhouUrlField.value),
    message: "请输入小宇宙频道地址",
    trigger: ["blur", "input"],
  },
  name: {
    required: false,
    trigger: ["blur", "input"],
    validator: (rule, value) => {
      if (!value) return true;

      // 基本字符验证
      const pattern = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/;
      if (!pattern.test(value)) {
        return new Error("只能输入中文、英文、数字、下划线和连字符");
      }

      // 总长度限制
      if (value.length > 16) {
        return new Error("名称长度不能超过16个字符");
      }

      // 提取不同类型的字符
      const chinese = value.match(/[\u4e00-\u9fa5]/g) || [];
      const symbols = value.match(/[_-]/g) || [];
      const english = value.match(/[a-zA-Z0-9]/g) || [];

      // 纯中文
      if (chinese.length === value.length) {
        if (chinese.length > 6) {
          return new Error("纯中文名称不能超过6个字符");
        }
      }
      // 纯符号
      else if (symbols.length === value.length) {
        if (symbols.length > 6) {
          return new Error("符号不能超过6个");
        }
      }
      // 混合情况
      else if (chinese.length > 0) {
        if (chinese.length > 6) {
          return new Error("中文不能超过6个字符");
        }
        if (symbols.length > 2) {
          return new Error("符号不能超过2个");
        }
        if (english.length > 6) {
          return new Error("英文和数字不能超过6个字符");
        }
      }

      return true;
    },
  },
  searchQuery: {
    required: computed(() => showSearchField.value),
    message: "请输入公众号名称",
    trigger: ["blur", "input"],
  },
  presetSelected: {
    required: computed(() => showPresetSelect.value),
    validator: (rule, value) => {
      if (
        formValue.value.type === RssSourceTypeEnum.PRESET &&
        (!value || value.length === 0)
      ) {
        return new Error("请至少选择一个 RSS 源");
      }
      return true;
    },
    trigger: ["change"],
  },
};

onMounted(() => {
  // 处理已选择过的预设源
  const presetList = (store.getSources || []).filter(
    (item) => item.type === RssSourceTypeEnum.PRESET
  );
  presetList.forEach((item) => formValue.value.presetSelected.push(item.url));
});

// 表单提交逻辑
const submitForm = async () => {
  try {
    loading.value = true;

    const sourceData = {
      type: formValue.value.type,
    };

    if (formValue.value.type === RssSourceTypeEnum.XIAOYUZHOU) {
      // 小宇宙表单
      sourceData.sourceUrl = formValue.value.xiaoyuzhouUrl;

      await store.addSource(sourceData, RssSourceTypeEnum.XIAOYUZHOU);
      submitSuccessSwitchTab(RssSourceTypeEnum.XIAOYUZHOU);
    } else if (formValue.value.type === RssSourceTypeEnum.PRESET) {
      // 对于预设源，为每个选中的源创建一个订阅
      const promises = formValue.value.presetSelected.map(async (url) => {
        const selected = PRESET_RSS_OPTIONS.find((opt) => opt.value === url);
        const sourceData = {
          type: RssSourceTypeEnum.RSS,
          name: formValue.value.name || selected.label,
          sourceUrl: selected.value,
        };
        return await store.addSource(sourceData, true);
      });

      await Promise.all(promises);
      submitSuccessSwitchTab(RssSourceTypeEnum.RSS);
    } else if (formValue.value.type === RssSourceTypeEnum.WECHAT) {
      // 微信公众号

      // await store.addSource(sourceData);
      submitSuccessSwitchTab(RssSourceTypeEnum.WECHAT);
    } else {
      // RSS 自定义源
      sourceData.name = formValue.value.name;
      sourceData.sourceUrl = formValue.value.sourceUrl;

      await store.addSource(sourceData);
      submitSuccessSwitchTab(RssSourceTypeEnum.RSS);
    }

    message.success("添加成功");
    resetForm();
  } catch (error) {
    message.error(error.message);
  } finally {
    await delay(300);
    loading.value = false;
  }
};

// 表单确认提交（使用防抖）
const handleConfirm = debounce((e) => {
  e?.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (errors) return;
    await submitForm();
  });
}, 300);

const resetForm = () => {
  formValue.value = {
    type: RssSourceTypeEnum.RSS,
    name: "",
    sourceUrl: "",
    xiaoyuzhouUrl: "",
    searchQuery: "",
    presetSelected: [],
  };
};

const handleCancel = () => {
  store.closeAddDialog();
  resetForm();
};

const handleTypeChange = () => {
  formValue.value.name = "";
  formValue.value.searchQuery = "";
};

// 提交成功后切换 tab
const submitSuccessSwitchTab = (tabId) => {
  storeAside().switchPanel(DEFAULT_PANEL);
  storeTab().switchTab(DEFAULT_PANEL, tabId);
  store.switchSourceData(tabId);
};

defineExpose({
  handleConfirm,
  handleCancel,
});
</script>

<template>
  <section class="add-rss-section">
    <h2 class="mb-4 text-lg font-bold text-[var(--text-primary)]">
      添加订阅源
    </h2>
    <div class="add-rss-item pr-4 mb-6">
      <NForm
        ref="formRef"
        :model="formValue"
        :rules="rules"
        :disabled="loading"
        label-placement="left"
        label-width="80"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="源类型" path="type">
          <NRadioGroup
            class="flex gap-4"
            v-model:value="formValue.type"
            @update:value="handleTypeChange"
          >
            <NRadio
              v-for="item in RSS_SOURCE_TYPES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </NRadio>
          </NRadioGroup>
        </NFormItem>

        <NFormItem v-if="showNameField" label="名称" path="name">
          <NInput v-model:value="formValue.name" placeholder="请输入源名称" />
        </NFormItem>

        <NFormItem v-if="showRssUrlField" label="URL" path="sourceUrl">
          <NInput
            v-model:value="formValue.sourceUrl"
            placeholder="请输入 RSS 源地址"
          />
        </NFormItem>

        <NFormItem v-if="showXiaoyuzhouUrlField" label="URL" path="xiaoyuzhouUrl">
          <NInput
            v-model:value="formValue.xiaoyuzhouUrl"
            placeholder="请输入小宇宙频道地址（Url）"
          />
        </NFormItem>

        <NFormItem v-if="showPresetSelect" label="选择源" path="presetSelected">
          <NCheckboxGroup
            class="flex flex-wrap gap-4"
            v-model:value="formValue.presetSelected"
          >
            <NCheckbox
              v-for="option in PRESET_RSS_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </NCheckbox>
          </NCheckboxGroup>
        </NFormItem>

        <NFormItem v-if="showSearchField" label="公众号" path="searchQuery">
          <NInput
            v-model:value="formValue.searchQuery"
            placeholder="请输入公众号名称搜索"
          />
        </NFormItem>

        <div class="flex justify-end gap-4">
          <NButton @click="handleCancel" :disabled="loading">取消</NButton>
          <NButton @click="handleConfirm" type="primary" :loading="loading">
            添加
          </NButton>
        </div>
      </NForm>
    </div>
  </section>
</template>
