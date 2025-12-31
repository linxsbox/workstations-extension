<script setup>
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { isObject, isEmptyObject } from "@linxs/toolkit";
import PlayButton from "@/components/player/PlayButton/PlayButton.vue";
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

const isPlay = computed(() => {
  return (
    getPlayStatus.value.src === props.data.mediaUrl &&
    getPlayStatus.value.isPlaying
  );
});

const clickPlay = () => {
  if (getPlayStatus.value.src === props.data.mediaUrl) {
    if (!props.data.mediaUrl) return;
    if (getPlayStatus.value.isError) {
      store.resetPlayer();
      return;
    }
    getPlayStatus.value.isPlaying = true;
    return;
  }

  const isAlbum = () => {
    if (!isObject(props.album)) return null;
    if (isEmptyObject(props.album)) return null;
    return props.album;
  };

  store.play({
    title: props.data.title,
    src: props.data.mediaUrl,
    album: isAlbum(),
    pid: props.pid || "",
  });
};
const clickPause = () => {
  getPlayStatus.value.src === props.data.mediaUrl && store.pause();
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
            <span v-if="props.data.duration">{{ props.data.duration }} ·</span>
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
