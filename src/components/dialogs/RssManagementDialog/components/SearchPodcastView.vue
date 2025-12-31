<script setup>
import {
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpin,
  NScrollbar,
  NPopconfirm,
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

const handleFormInput = debounce(async () => {
  if (!formSearchWord.value || !formSearchWord.value.trim()) {
    return;
  }
  searchWord.value = formSearchWord.value;
  showSearchModal.value = true;

  await getPodcastList(searchWord.value);
  await getPodcastList1(searchWord.value);
  queryXyzItem(searchWord.value);
}, 500);

const handleSearchInput = debounce(async () => {
  await getPodcastList(searchWord.value);
}, 500);

const handleClickPodcst = (item) => {};

const getPodcastList = async (query = "") => {
  if (!query) return;

  try {
    searchLoading.value = true;

    const res = await fetch(
      `  https://ask.xiaoyuzhoufm.com/api/keyword/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
      }
    );

    if (!res.ok) {
      return message.error(res.statusText || "啊噢~搜索失败咯！");
    }

    const dataJson = await res.json();
    podcastList.value = ((dataJson.data || {}).podcasts || []).map((item) => {
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
  } finally {
    searchLoading.value = false;
  }
};

const podXyzCache = [];
const getPodcastList1 = async (id) => {
  if (podXyzCache.length > 0) {
    return;
  }

  const res = await fetch(`https://getpodcast.xyz/`);

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(await res.text(), "text/html");

  xmlDoc.querySelectorAll(".pic_list").forEach((item) => {
    item.querySelectorAll("li").forEach((liItem) => {
      liItem.childNodes.length > 0 &&
        podXyzCache.push({
          title: liItem.querySelector(".title").textContent,
          image: liItem.querySelector("img").src,
          link: liItem.querySelector("a").href,
          author: item.author || "",
          brief: item.brief || "",
          color: "",
        });
    });
  });
};
const queryXyzItem = (word = "") => {
  const tmpList = [...podcastList.value];

  podXyzCache
    .filter((item) =>
      item.title.toLocaleLowerCase().includes(word.toLocaleLowerCase())
    )
    .forEach((item) => {
      tmpList.push(item);
    });

  podcastList.value = tmpList;
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
            placeholder="请输入播客名称"
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
        placeholder="请输入播客名称"
      />
      <div class="flex-1 overflow-hidden">
        <div class="flex justify-center p-4" v-if="searchLoading">
          <NSpin size="small" />
        </div>
        <NScrollbar
          class="px-2"
          content-class="flex flex-wrap gap-3 h-[inherit] "
          v-else
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
              是否订阅播客：【{{ item.title }}】
            </NPopconfirm>
          </template>
        </NScrollbar>
      </div>
    </div>
  </NModal>
</template>
