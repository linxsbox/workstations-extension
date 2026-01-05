<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { isObject } from '@linxs/toolkit';
import { storePlayer } from '@/stores/modules/player';

const props = defineProps({
  // 封面尺寸模式：'small' | 'medium' | 'large'
  size: {
    type: String,
    default: 'medium'
  },
  // 是否显示为背景（标准模式使用）
  asBackground: {
    type: Boolean,
    default: false
  }
});

// Store
const player = storePlayer();
const { getPlayStatus } = storeToRefs(player);

/** 获取封面图片 URL */
const coverImage = computed(() => {
  const album = getPlayStatus.value.album;
  if (album && isObject(album) && album.image) {
    return album.image;
  }
  // 默认封面
  return '';
});

/** 获取封面尺寸类名 */
const sizeClass = computed(() => {
  return `cover-${props.size}`;
});

/** 是否有封面 */
const hasCover = computed(() => {
  return !!coverImage.value;
});
</script>

<template>
  <div
    v-if="asBackground"
    class="player-cover-background"
    :style="{ backgroundImage: hasCover ? `url(${coverImage})` : 'none' }"
  >
    <slot></slot>
  </div>
  <div
    v-else
    class="player-cover flex-none rounded-md overflow-hidden bg-gray-100"
    :class="sizeClass"
  >
    <img
      v-if="hasCover"
      :src="coverImage"
      :alt="getPlayStatus.title || '封面'"
      class="w-full h-full object-cover"
    />
    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor"/>
      </svg>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-cover {
  &.cover-small {
    width: 48px;
    height: 48px;
  }

  &.cover-medium {
    width: 80px;
    height: 80px;
  }

  &.cover-large {
    width: 200px;
    height: 200px;
  }
}

.player-cover-background {
  position: relative;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.6) 100%
    );
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }
}
</style>
