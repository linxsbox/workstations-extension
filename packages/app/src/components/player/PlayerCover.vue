<script setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { isObject } from "@linxs/toolkit";
import { storePlayer } from "@/stores/global/player";
import { getCoverImageFormats, tryLoadCoverImage } from "@/utils/image";
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
// 当前尝试的封面 URL（可能是 base64）
const currentCoverUrl = ref('');
// 当前格式索引
const currentFormatIndex = ref(0);
// 可用的封面格式列表
const availableFormats = ref([]);
// 是否正在加载图片
const isLoadingImage = ref(false);
// 原始 URL 是否有扩展名
const hasOriginalExtension = ref(false);

/** 获取原始封面图片 URL */
const originalCoverUrl = computed(() => {
  const album = getPlayStatus.value.album;
  if (album && isObject(album) && album.image) {
    return album.image;
  }
  return "";
});

/** 尝试加载下一个格式的封面 */
const tryNextFormat = async () => {
  if (currentFormatIndex.value >= availableFormats.value.length) {
    // 所有格式都失败了
    imageLoadError.value = true;
    currentCoverUrl.value = '';
    isLoadingImage.value = false;
    return;
  }

  const url = availableFormats.value[currentFormatIndex.value];
  const isLastAttempt = currentFormatIndex.value === availableFormats.value.length - 1;

  isLoadingImage.value = true;

  try {
    // 尝试加载图片，如果是最后一次尝试且原始 URL 无扩展名则转换为 base64
    const loadedUrl = await tryLoadCoverImage(url, isLastAttempt, hasOriginalExtension.value);
    currentCoverUrl.value = loadedUrl;
    imageLoadError.value = false;
  } catch (error) {
    // 加载失败，尝试下一个格式
    currentFormatIndex.value++;
    await tryNextFormat();
  } finally {
    isLoadingImage.value = false;
  }
};

// 监听原始封面 URL 变化，重置状态并获取格式列表
watch(originalCoverUrl, async (newUrl) => {
  imageLoadError.value = false;
  currentFormatIndex.value = 0;
  availableFormats.value = getCoverImageFormats(newUrl);
  // 检查原始 URL 是否有扩展名
  hasOriginalExtension.value = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(newUrl);

  if (availableFormats.value.length > 0) {
    await tryNextFormat();
  } else {
    currentCoverUrl.value = '';
  }
}, { immediate: true });

/** 封面图片 URL（当前尝试的，可能是 base64） */
const coverImage = computed(() => currentCoverUrl.value);

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
  return hasCover.value && !imageLoadError.value && !isLoadingImage.value;
});

/** 图片加载失败处理（非背景模式） */
const handleImageError = async () => {
  // 尝试下一个格式
  if (currentFormatIndex.value < availableFormats.value.length - 1) {
    currentFormatIndex.value++;
    await tryNextFormat();
  } else {
    // 所有格式都失败了
    imageLoadError.value = true;
  }
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
