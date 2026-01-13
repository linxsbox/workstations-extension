<script setup>
import {
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpin,
  NScrollbar,
  NPopconfirm,
  NEmpty,
  useMessage,
} from "naive-ui";
import { debounce } from "@linxs/toolkit";
import PodcastCardView from "./PodcastCardView.vue";
import { storeRss } from "@/stores/modules/rss";
import { storePodcast } from "@/stores/modules/podcast";
import { RssSourceTypeEnum } from "@/stores/modules/rss/config";

const message = useMessage();
const rssStore = storeRss();
const podcastStore = storePodcast();

const formSearchWord = ref("");
const showSearchModal = ref(false);
const searchWord = ref("");
const searchLoading = ref(false);
const podcastList = ref([]);

// 请求取消控制器
let searchAbortController = null;

// 监听模态框关闭，取消所有正在进行的请求
watch(showSearchModal, (newValue) => {
  if (!newValue) {
    // 模态框关闭时，取消所有正在进行的请求
    if (searchAbortController) {
      searchAbortController.abort();
      searchAbortController = null;
    }
    // 重置加载状态
    searchLoading.value = false;
  }
});

// 打开搜索弹窗并执行搜索
const openSearchModal = async () => {
  const trimmedWord = formSearchWord.value?.trim();
  if (!trimmedWord) {
    message.warning("请输入播客名称");
    return;
  }

  // 如果弹窗已打开或正在加载，忽略
  if (showSearchModal.value || searchLoading.value) {
    return;
  }

  searchWord.value = trimmedWord;
  showSearchModal.value = true;

  // 执行搜索
  await performSearch(searchWord.value);
};

// 处理表单输入（延迟触发）
const handleFormInput = debounce(async () => {
  const trimmedWord = formSearchWord.value?.trim();
  if (!trimmedWord) {
    return;
  }

  // 自动打开搜索弹窗
  await openSearchModal();
}, 500);

// 执行搜索（在弹窗内）
const handleSearchInput = debounce(async () => {
  if (!searchWord.value?.trim()) {
    podcastList.value = [];
    return;
  }

  await performSearch(searchWord.value);
}, 500);

// 处理弹窗内搜索回车
const handleSearchEnter = () => {
  // 如果正在加载，忽略重复请求
  if (searchLoading.value) {
    return;
  }

  if (searchWord.value?.trim()) {
    performSearch(searchWord.value);
  }
};

// 统一的搜索逻辑
const performSearch = async (query) => {
  // 取消之前的搜索请求
  if (searchAbortController) {
    searchAbortController.abort();
    searchAbortController = null;
  }

  // 创建新的 AbortController
  searchAbortController = new AbortController();
  const currentController = searchAbortController;

  try {
    searchLoading.value = true;
    podcastList.value = [];

    // 使用 store 的搜索方法
    const results = await podcastStore.searchPodcasts(
      query,
      currentController.signal
    );

    // 检查请求是否被取消
    if (currentController.signal.aborted) {
      return;
    }

    podcastList.value = results;
  } catch (error) {
    // 忽略取消请求的错误
    if (error.name === "AbortError") {
      console.log("搜索已取消");
      return;
    }
    console.error("搜索失败:", error);
    message.error("搜索失败，请重试");
  } finally {
    // 只有当前控制器仍然是活动控制器时才重置 loading 状态
    if (currentController === searchAbortController) {
      searchLoading.value = false;
    }
  }
};

// 处理订阅播客
const handleClickPodcst = async (item) => {
  try {
    // 根据链接判断播客类型
    const getSourceType = (link) => {
      if (link.includes('xiaoyuzhoufm.com')) {
        return RssSourceTypeEnum.XIAOYUZHOU;
      }
      // 其他平台默认为标准 RSS
      return RssSourceTypeEnum.RSS;
    };

    // 构造 RSS 源对象
    const source = {
      type: getSourceType(item.link),
      name: item.title,
      sourceUrl: item.link,
    };

    // 添加到订阅列表（不关闭 RSS 管理对话框）
    await rssStore.addSource(source, { closeDialog: false });

    message.success(`已订阅: ${item.title}`);

    // 关闭搜索弹窗
    showSearchModal.value = false;
  } catch (error) {
    console.error("订阅播客失败:", error);
    message.error(error.message || "订阅失败，请重试");
  }
};
</script>

<template>
  <section class="podcast-section">
    <h2 class="mb-4 text-lg font-bold text-[var(--text-primary)]">订阅播客</h2>
    <div class="podcast-item pr-4 mb-6">
      <NForm
        ref="formRef"
        label-placement="left"
        label-width="80"
        require-mark-placement="right-hanging"
      >
        <NFormItem label="搜索播客" path="type">
          <NInput
            v-model:value="formSearchWord"
            :on-input="handleFormInput"
            @keyup.enter="openSearchModal"
            placeholder="请输入播客名称（支持小宇宙、GetPodcast.xyz）"
            clearable
          />
        </NFormItem>
      </NForm>
    </div>
  </section>

  <NModal
    v-model:show="showSearchModal"
    :mask-closable="false"
    transform-origin="center"
    preset="card"
    title="搜索播客"
    class="w-[75vw] max-w-[1200px] h-[80vh]"
    content-style="height: 100%; overflow: hidden;"
  >
    <div class="flex flex-col gap-4 h-[inherit] overflow-hidden">
      <NInput
        v-model:value="searchWord"
        :on-input="handleSearchInput"
        @keyup.enter="handleSearchEnter"
        placeholder="请输入播客名称"
        clearable
      />

      <div class="flex-1 overflow-hidden">
        <!-- 加载状态 -->
        <div class="flex justify-center items-center h-full" v-if="searchLoading">
          <NSpin size="large">
            <template #description>
              <span class="text-[var(--text-secondary)]">搜索中...</span>
            </template>
          </NSpin>
        </div>

        <!-- 空状态 -->
        <div v-else-if="podcastList.length === 0" class="flex justify-center items-center h-full">
          <NEmpty description="未找到相关播客" />
        </div>

        <!-- 搜索结果 -->
        <NScrollbar
          v-else
          class="px-2 h-full"
          content-class="flex flex-wrap gap-3"
        >
          <template v-for="item in podcastList" :key="item.id">
            <NPopconfirm
              positive-text="订阅"
              negative-text="取消"
              @positive-click="handleClickPodcst(item)"
            >
              <template #trigger>
                <PodcastCardView :data="item" />
              </template>
              <div class="max-w-xs">
                是否订阅播客：<strong>{{ item.title }}</strong>
              </div>
            </NPopconfirm>
          </template>
        </NScrollbar>
      </div>
    </div>
  </NModal>
</template>
