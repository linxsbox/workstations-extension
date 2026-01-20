<script setup>
import { ref, computed } from "vue";
import { NScrollbar, useMessage } from "naive-ui";
import { debounce } from "@linxs/toolkit";
import RssCardView from "./RssCardView.vue";
import IconRefresh from "@/components/common/Icons/IconRefresh.vue";
import { storeRss } from "@/stores/modules/rss";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      list: [],
    }),
  },
});

const rssStore = storeRss();

// 刷新动画状态
const isRefreshing = ref(false);

// 是否显示刷新按钮（距离上次更新 >= 5分钟，或正在刷新中）
const showRefreshBtn = computed(() => {
  // 刷新中时也显示按钮（用于动画）
  if (isRefreshing.value) return true;

  const now = Date.now();
  const lastUpdate = props.data.lastUpdateTime || 0;
  const cooldown = 5 * 60 * 1000; // 5分钟

  return now - lastUpdate >= cooldown;
});

// 点击刷新（使用 debounce 防止重复点击）
const handleRefresh = debounce(async () => {
  if (!showRefreshBtn.value) return;

  // 开启动画
  isRefreshing.value = true;

  try {
    await rssStore.updateSource(props.data.sourceUrl, true);
  } catch (_) {
  } finally {
    // 500ms 后关闭动画
    setTimeout(() => {
      isRefreshing.value = false;
    }, 500);
  }
}, 300);

// 构建播客信息
const getAlbum = () => {
  return {
    title: props.data.title || "", // 播客名称 - 专辑标题
    author: props.data.author || "", // 播客作者
    image: props.data.image || "", // 播客Logo - 专辑封面
    theme: props.data.theme || null, // 主题颜色
  };
};

// 获取主题颜色
const getThemeColor = (theme) => {
  if (!theme) return {};

  return {
    "--origin-theme": theme.color,
    "--origin-theme-rgb": theme.rgb,
    "--origin-theme-bg": `rgba(${theme.rgb}, 0.035)`, // 卡片背景
    "--origin-theme-bg-hover": `rgba(${theme.rgb}, 0.1)`, // 卡片移入背景
    "--origin-theme-border": `rgba(${theme.rgb}, 0.15)`, // 卡片边框
    "--origin-theme-header":
      "linear-gradient(45deg, rgba(var(--origin-theme-rgb), 0.45), rgba(var(--origin-theme-rgb), 0.3))",
    "--play-button-bg-color": theme.rgb,
  };
};
</script>

<template>
  <section
    class="rss-list flex-1 h-full rounded-md overflow-hidden"
    :style="getThemeColor(props.data.theme)"
  >
    <NScrollbar class="rss-list-box flex flex-col gap-3 h-full">
      <header
        class="rss-list-header sticky top-0 flex-none flex gap-2 items-center p-4 z-10"
      >
        <figure class="flex-none h-12">
          <picture class="avater-container">
            <img
              class="size-12 rounded-lg avater"
              :src="props.data.image"
              v-if="props.data.image"
            />
          </picture>
        </figure>
        <div class="flex-auto">
          <div class="flex justify-between items-center">
            <a
              class="title text-lg font-bold"
              :href="props.data.link || props.data.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ props.data.title }}
            </a>
            <div class="flex items-center gap-2">
              <span class="author">{{ props.data.author }}</span>
            </div>
          </div>
          <div class="description text-[var(--text-tertiary)]">
            {{ props.data.description }}
          </div>
        </div>

        <button
          v-if="showRefreshBtn"
          class="refresh-btn absolute top-1 right-1 cursor-pointer bg-transparent border-none hidden"
          aria-label="刷新数据源"
          title="刷新数据源"
          @click="handleRefresh"
        >
          <IconRefresh
            class="text-sm text-[var(--color-info)] cursor-pointer"
            :class="{ 'animate-spin': isRefreshing }"
          />
        </button>
      </header>
      <div class="flex flex-col gap-3 p-4">
        <RssCardView
          v-for="item in props.data.list"
          :data="item"
          :key="item.link"
          :pid="props.data.id"
          :album="getAlbum()"
        />
      </div>
    </NScrollbar>
  </section>
</template>

<style lang="scss" scoped>
.rss-list {
  min-width: 480px;
  background-color: var(--bg-secondary, --bg-primary);

  .rss-list-box {
    .rss-list-header {
      background: var(--origin-theme-header, trasparent);
      border-bottom: 1px solid var(--origin-theme, var(--border-color));
      backdrop-filter: blur(6px);

      .title {
        color: rgb(var(--origin-theme-rgb));
        text-shadow: 1px 1px 1px var(--text-tertiary);
      }

      &:hover {
        .refresh-btn {
          display: block;
        }
      }
    }
  }
}
</style>
