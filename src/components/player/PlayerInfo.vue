<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { isObject } from "@linxs/toolkit";
import { storePlayer } from "@/stores/global/player";
import PlayerCover from "./PlayerCover.vue";

const props = defineProps({
  // 对齐方式：'left' | 'center'
  align: {
    type: String,
    default: "left",
  },
  // 是否显示艺术家
  showArtist: {
    type: Boolean,
    default: true,
  },
  // 是否显示封面
  showCover: {
    type: Boolean,
    default: true,
  },
  // 封面尺寸
  coverSize: {
    type: Number,
    default: 64,
  },
});

// Store
const player = storePlayer();
const { getPlayStatus } = storeToRefs(player);

/** 歌曲标题 */
const title = computed(() => {
  return getPlayStatus.value.title || "未知歌曲";
});

/** 艺术家名称 */
const artist = computed(() => {
  // 优先从顶级 artist 字段获取
  if (getPlayStatus.value.artist) {
    return getPlayStatus.value.artist;
  }

  // 如果没有，从 album 中获取
  const album = getPlayStatus.value.album;
  if (album && isObject(album)) {
    return album.author || album.artist || album.name || "未知艺术家";
  }

  return "未知艺术家";
});

/** 对齐类名 */
const alignClass = computed(() => {
  return props.align === "center" ? "text-center" : "text-left";
});
</script>

<template>
  <div class="player-info min-w-0 w-full flex gap-4 items-center">
    <!-- 封面 -->
    <PlayerCover v-if="showCover" :size="coverSize" />

    <!-- 歌曲信息 -->
    <div class="info flex-1 min-w-0 overflow-hidden" :class="alignClass">
      <div class="song-title text-base font-medium truncate">
        {{ title }}
      </div>
      <div
        v-if="showArtist"
        class="song-artist text-sm truncate mt-1"
      >
        {{ artist }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.song-title {
  color: var(--text-primary);
}

.song-artist {
  color: var(--text-secondary);
}
</style>
