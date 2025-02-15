<script setup>
import { NScrollbar } from "naive-ui";
import RssCardView from "./RssCardView.vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      list: [],
    }),
  },
});

// 构建播客信息
const getAlbum = () => {
  return {
    author: props.data.author || "", // 播客作者
    albumTitle: props.data.title || "", // 播客名称 - 专辑标题
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
              :href="props.data.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ props.data.title }}
            </a>
            <span class="author">{{ props.data.author }}</span>
          </div>
          <div class="description text-[var(--text-color-2)]">
            {{ props.data.description }}
          </div>
        </div>
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
        text-shadow: 1px 1px 1px var(--text-color-2);
      }
    }
  }
}
</style>
