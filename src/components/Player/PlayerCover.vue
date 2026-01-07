<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { isObject } from "@linxs/toolkit";
import { storePlayer } from "@/stores/modules/player";
import IconMusicNote from "@/components/common/Icons/IconMusicNote.vue";

const props = defineProps({
  // 封面尺寸：支持 48, 64, 80, 200 等数字
  size: {
    type: Number,
    default: 64,
  },
  // 是否显示为背景（标准模式使用）
  asBackground: {
    type: Boolean,
    default: false,
  },
});

// Store
const player = storePlayer();
const { getPlayStatus } = storeToRefs(player);

// 图片加载失败状态
const imageLoadError = ref(false);

/** 获取封面图片 URL */
const coverImage = computed(() => {
  const album = getPlayStatus.value.album;
  if (album && isObject(album) && album.image) {
    return album.image;
  }
  // 默认封面
  return "";
});

// 监听封面图片变化，重置加载失败状态并预加载（背景模式）
watch(coverImage, (newUrl) => {
  imageLoadError.value = false;

  // 背景模式下使用 Image 对象预加载检测
  if (props.asBackground && newUrl) {
    const img = new Image();
    img.onload = () => {
      // 图片加载成功，imageLoadError 保持 false
    };
    img.onerror = () => {
      // 图片加载失败
      imageLoadError.value = true;
    };
    img.src = newUrl;
  }
});

/** 封面尺寸样式 */
const sizeStyle = computed(() => {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
  };
});

/** 是否有封面 */
const hasCover = computed(() => {
  return !!coverImage.value;
});

/** 是否显示封面图片（有URL且未加载失败） */
const shouldShowImage = computed(() => {
  return hasCover.value && !imageLoadError.value;
});

/** 图片加载失败处理（非背景模式） */
const handleImageError = () => {
  imageLoadError.value = true;
};
</script>

<template>
  <div
    v-if="asBackground"
    class="player-cover-background relative size-full bg-cover bg-center bg-no-repeat"
    :style="{
      backgroundImage: shouldShowImage ? `url(${coverImage})` : 'none',
    }"
    :class="{ 'no-cover': !shouldShowImage }"
  >
    <!-- 无封面时显示默认背景和图标 -->
    <div
      v-if="!shouldShowImage"
      class="absolute inset-0 flex items-center justify-center z-[1]"
    >
      <IconMusicNote
        class="cover-placeholder"
        :style="{ fontSize: `${props.size * 0.5}px` }"
      />
    </div>
    <div class="relative size-full z-[2]">
      <slot></slot>
    </div>
  </div>
  <div
    v-else
    class="player-cover flex-none flex items-center justify-center rounded-lg overflow-hidden"
    :style="sizeStyle"
  >
    <img
      v-if="shouldShowImage"
      :src="coverImage"
      :alt="getPlayStatus.title || '封面'"
      class="size-full object-cover"
      @error="handleImageError"
    />
    <IconMusicNote
      v-else
      class="cover-placeholder"
      :style="{ fontSize: `${props.size * 0.5}px` }"
    />
  </div>
</template>

<style lang="scss" scoped>
.player-cover {
  background-color: var(--player-cover-bg);
}

.player-cover-background {
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--player-cover-overlay-gradient);
  }

  &.no-cover::before {
    background: var(--player-cover-no-overlay-gradient);
  }
}

.cover-placeholder {
  color: var(--player-cover-placeholder-color);
}
</style>
