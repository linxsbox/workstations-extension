<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { isObject, isEmptyObject } from "@linxs/toolkit";
import { sec2min } from "@/utils/time";
import PlayButton from "@/components/player/PlayButton.vue";
import AddToQueueButton from "@/components/player/AddToQueueButton.vue";
import { storePlayer } from "@/stores/modules/player";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  pid: {
    type: String,
    default: "",
  },
  album: {
    type: [Object, null],
    default: null,
  },
});

const store = storePlayer();
const { getPlayStatus } = storeToRefs(store);

onMounted(() => {});

// 获取专辑信息
const getAlbumInfo = () => {
  if (!isObject(props.album)) return null;
  if (isEmptyObject(props.album)) return null;
  return props.album;
};

// 构建轨道数据
const buildTrackData = () => {
  return {
    title: props.data.title,
    src: props.data.mediaUrl,
    album: getAlbumInfo(),
    pid: props.pid || "",
    duration: props.data.duration || 0, // 原始秒数
    artist: props.data.author || "",
  };
};

const isPlay = computed(() => {
  return (
    getPlayStatus.value.src === props.data.mediaUrl &&
    getPlayStatus.value.isPlaying
  );
});

const clickPlay = () => {
  if (!props.data.mediaUrl) return;

  // 如果是当前播放的曲目
  if (getPlayStatus.value.src === props.data.mediaUrl) {
    if (getPlayStatus.value.isError) {
      store.resetPlayer();
      return;
    }
    store.togglePlay();
    return;
  }

  // 添加到队列并播放
  store.addAndPlay(buildTrackData());
  // 显示播放器
  store.showPlayer();
};

const clickPause = () => {
  if (getPlayStatus.value.src === props.data.mediaUrl) {
    store.pause();
  }
};
</script>

<template>
  <section class="rss-card flex rounded-md">
    <div class="card-panel flex w-full h-full gap-3 p-2 rounded-md">
      <div class="left flex-none flex flex-col gap-4 pl-1">
        <PlayButton
          class="text-4xl text-[var(--origin-theme)]"
          v-if="props.data.mediaUrl"
          @play="clickPlay"
          @pause="clickPause"
          :isPlay="isPlay"
        />
        <!-- 添加到播放列表按钮 -->
        <AddToQueueButton
          v-if="props.data.mediaUrl"
          class="text-[var(--origin-theme)]"
          :track="buildTrackData()"
          :iconSize="36"
        />
      </div>
      <div class="right flex-1 flex flex-col gap-1">
        <header class="card-header">
          <div class="title text-sm text-[var(--origin-theme)] font-bold">
            <a
              :href="props.data.link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ props.data.title }}
            </a>
          </div>
          <!-- <div class="author flex justify-between text-xs">
            <span>{{ props.data.author }}</span>
            <span class="text-[var(--text-color-2)]" v-if="props.data.pubDate"> {{ props.data.pubDate || "" }} </span>
          </div> -->
        </header>
        <div class="description text-sm break-words line-clamp-2">
          {{ props.data.description || props.data.summary }}
        </div>
        <footer class="card-footer text-xs">
          <div v-if="props.data.duration || props.data.timeAgo">
            <span v-if="props.data.duration">{{ sec2min(props.data.duration) }} 分钟 ·</span>
            {{ props.data.timeAgo || "" }}
          </div>
          <div
            class="flex gap-4 justify-between"
            v-else-if="props.data.author || props.data.pubDate"
          >
            <div v-if="props.data.pubDate">{{ props.data.pubDate }}</div>
            <div v-if="props.data.author">{{ props.data.author }}</div>
          </div>
        </footer>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.rss-card {
  background-color: var(--bg-primary);

  .card-panel {
    color: var(--text-primary);
    background-color: var(--origin-theme-bg, var(--bg-primary));
    border: 1px solid var(--origin-theme-border, var(--border-color));
    transition: background-color 0.3s 0.15s;

    &:hover {
      background-color: var(
        --origin-theme-bg-hover,
        var(--interactive-bg-hover)
      );
      transition-duration: 0s;
      transition-delay: 0s;
    }
  }

  .description {
    color: var(--text-secondary);
    overflow-wrap: anywhere;
  }

  .card-footer {
    color: var(--text-color-2);
  }
}
</style>
