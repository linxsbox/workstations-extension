<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { isObject } from '@linxs/toolkit';
import { storePlayer } from '@/stores/modules/player';

const props = defineProps({
  // 对齐方式：'left' | 'center'
  align: {
    type: String,
    default: 'left'
  },
  // 是否显示艺术家
  showArtist: {
    type: Boolean,
    default: true
  }
});

// Store
const player = storePlayer();
const { getPlayStatus } = storeToRefs(player);

/** 歌曲标题 */
const title = computed(() => {
  return getPlayStatus.value.title || '未知歌曲';
});

/** 艺术家名称 */
const artist = computed(() => {
  const album = getPlayStatus.value.album;
  if (album && isObject(album)) {
    return album.artist || album.name || '未知艺术家';
  }
  return '未知艺术家';
});

/** 对齐类名 */
const alignClass = computed(() => {
  return props.align === 'center' ? 'text-center' : 'text-left';
});
</script>

<template>
  <div class="player-info" :class="alignClass">
    <div class="song-title text-base font-medium text-gray-900 truncate">
      {{ title }}
    </div>
    <div v-if="showArtist" class="song-artist text-sm text-gray-500 truncate mt-1">
      {{ artist }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-info {
  min-width: 0;
  overflow: hidden;
}
</style>
