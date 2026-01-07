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
import { isString, isObject, debounce, hex2rgb } from "@linxs/toolkit";
import PodcastCardView from "./PodcastCardView.vue";

const message = useMessage();

const formSearchWord = ref("");
const showSearchModal = ref(false);
const searchWord = ref("");
const searchLoading = ref(false);
const podcastList = ref([]);
const podcastXyzCache = ref([]); // 使用 ref 管理缓存

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
  try {
    searchLoading.value = true;
    podcastList.value = [];

    // 并行搜索小宇宙和 GetPodcast.xyz
    const [xiaoyuzhouResults] = await Promise.allSettled([
      searchXiaoyuzhouPodcasts(query),
      ensureGetPodcastXyzCache(),
    ]);

    // 合并结果
    const allResults = [];

    if (xiaoyuzhouResults.status === "fulfilled") {
      allResults.push(...xiaoyuzhouResults.value);
    }

    // 从缓存中搜索匹配项
    if (podcastXyzCache.value.length > 0) {
      const matches = podcastXyzCache.value.filter((item) =>
        item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      );
      allResults.push(...matches);
    }

    podcastList.value = allResults;
  } catch (error) {
    console.error("搜索失败:", error);
    message.error("搜索失败，请重试");
  } finally {
    searchLoading.value = false;
  }
};

// 搜索小宇宙播客
const searchXiaoyuzhouPodcasts = async (query) => {
  if (!query) return [];

  try {
    const res = await fetch(
      `https://ask.xiaoyuzhoufm.com/api/keyword/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!res.ok) {
      throw new Error(res.statusText || "搜索失败");
    }

    const dataJson = await res.json();
    const podcasts = dataJson.data?.podcasts || [];

    return podcasts.map((item) => {
      const getImgSrc = () => {
        if (isString(item.image)) return item.image;
        return isObject(item.image) ? item.image.thumbnailUrl : "";
      };

      const getColor = () => {
        if (isObject(item.color) && item.color.original) {
          if (item.color.original.includes("#")) {
            const { r, g, b } = hex2rgb(item.color.original);
            return `${r},${g},${b}`;
          }
          return item.color.original;
        }
        if (isString(item.color)) {
          if (item.color.includes("#")) {
            const { r, g, b } = hex2rgb(item.color);
            return `${r},${g},${b}`;
          }
          return item.color;
        }
        return "";
      };

      return {
        id: item.pid,
        title: item.title || "",
        author: item.author || "",
        brief: item.brief || "",
        image: getImgSrc(),
        color: getColor(),
        link: `https://www.xiaoyuzhoufm.com/podcast/${item.pid}`,
      };
    });
  } catch (error) {
    console.error("小宇宙搜索失败:", error);
    return [];
  }
};

// 确保 GetPodcast.xyz 缓存已加载
const ensureGetPodcastXyzCache = async () => {
  if (podcastXyzCache.value.length > 0) {
    return;
  }

  try {
    const res = await fetch(`https://getpodcast.xyz/`);
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(await res.text(), "text/html");

    const cache = [];
    htmlDoc.querySelectorAll(".pic_list").forEach((list) => {
      list.querySelectorAll("li").forEach((liItem) => {
        if (liItem.childNodes.length > 0) {
          const titleEl = liItem.querySelector(".title");
          const imgEl = liItem.querySelector("img");
          const linkEl = liItem.querySelector("a");

          if (titleEl && imgEl && linkEl) {
            cache.push({
              id: linkEl.href,
              title: titleEl.textContent.trim(),
              image: imgEl.src,
              link: linkEl.href,
              author: "",
              brief: "",
              color: "",
            });
          }
        }
      });
    });

    podcastXyzCache.value = cache;
  } catch (error) {
    console.error("GetPodcast.xyz 缓存加载失败:", error);
  }
};

// 处理订阅播客
const handleClickPodcst = (item) => {
  console.log("订阅播客:", item);
  message.success(`已订阅: ${item.title}`);
  // TODO: 实际的订阅逻辑
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
