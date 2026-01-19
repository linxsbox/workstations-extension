<script setup>
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useMessage } from "naive-ui";
import { isObject, isEmptyObject } from "@linxs/toolkit";
import { sec2min } from "@/utils/time";
import PlayButton from "@/components/player/PlayButton.vue";
import AddToQueueButton from "@/components/player/AddToQueueButton.vue";
import IconFiberNew from "@/components/common/Icons/IconFiberNew.vue";
import IconShare from "@/components/common/Icons/IconShare.vue";
import ShareCardDialog from "@/components/dialogs/ShareCardDialog/ShareCardDialog.vue";
import { storePlayer } from "@/stores/modules/player";
import { storeRss } from "@/stores/modules/rss";

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
const rssStore = storeRss();
const { getPlayStatus } = storeToRefs(store);
const message = useMessage();

onMounted(() => {});

// 获取专辑信息
const getAlbumInfo = () => {
  if (!isObject(props.album)) return null;
  if (isEmptyObject(props.album)) return null;
  return props.album;
};

// 构建轨道数据
const buildTrackData = () => {
  const albumInfo = getAlbumInfo();

  return {
    title: props.data.title,
    src: props.data.mediaUrl,
    album: albumInfo,
    pid: props.pid || "",
    duration: props.data.duration || 0,
    // 从 album 中获取作者信息（播客作者）
    artist: albumInfo?.author || "",
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

  // 标记为已读
  if (props.data.link) {
    rssStore.markAsRead(props.data.link);
  }

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

// 添加到队列成功
const handleAddToQueueSuccess = (track) => {
  // 标记为已读
  if (props.data.link) {
    rssStore.markAsRead(props.data.link);
  }
  message.success(`已添加到播放列表: ${track.title}`);
};

// 点击标题链接
const handleTitleClick = () => {
  // 标记为已读
  if (props.data.link) {
    rssStore.markAsRead(props.data.link);
  }
};

// 添加到队列重复
const handleAddToQueueDuplicate = (track) => {
  message.warning(`${track.title} 已在播放列表中`);
};

// 添加到队列失败
const handleAddToQueueError = (error) => {
  message.error(`添加失败: ${error?.message || "未知错误"}`);
};

// 分享相关
const showShareCard = ref(false);

// 获取分享图片
const getShareImage = computed(() => {
  const albumInfo = getAlbumInfo();
  return albumInfo?.image || albumInfo?.cover || "";
});

// 获取分享内容
const getShareContent = computed(() => {
  return props.data.title || "";
});

// 获取分享链接
const getShareLink = computed(() => {
  return props.data.link || "";
});

// 点击分享按钮
const handleShare = () => {
  if (!getShareLink.value) {
    message.warning("该内容没有可分享的链接");
    return;
  }
  showShareCard.value = true;
};

// 关闭分享卡片
const handleCloseShare = () => {
  showShareCard.value = false;
};
</script>

<template>
  <section class="rss-card flex rounded-md">
    <div class="card-panel relative flex w-full h-full gap-3 p-2 rounded-md">
      <div class="left flex-none flex flex-col items-center gap-4 pl-1">
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
          @success="handleAddToQueueSuccess"
          @duplicate="handleAddToQueueDuplicate"
          @error="handleAddToQueueError"
        />
      </div>
      <div class="right flex-1 flex flex-col gap-1">
        <header class="card-header">
          <div class="title text-sm font-bold">
            <a
              :href="props.data.link"
              target="_blank"
              rel="noopener noreferrer"
              @click="handleTitleClick"
            >
              {{ props.data.title }}
            </a>
          </div>
        </header>
        <div class="description text-sm break-words line-clamp-2">
          {{ props.data.description || props.data.summary }}
        </div>
        <footer class="card-footer flex gap-4 justify-between">
          <div class="left-info">
            <template v-if="props.data.duration || props.data.timeAgo">
              <span v-if="props.data.duration"
                >{{ sec2min(props.data.duration) }} 分钟 ·</span
              >
              {{ props.data.timeAgo || "" }}
            </template>
            <div
              class="inline-flex gap-3"
              v-else-if="props.data.author || props.data.pubDate"
            >
              <div v-if="props.data.pubDate">{{ props.data.pubDate }}</div>
              <div v-if="props.data.author" class="font-bold">
                {{ props.data.author }}
              </div>
            </div>
          </div>
          <div class="right-bar inline-flex gap-2">
            <!-- 预留操作扩展栏 -->
            <button class="share-btn p-1 rounded-md" @click="handleShare" title="分享">
              <IconShare />
            </button>
          </div>
        </footer>
      </div>

      <!-- 新内容标记 -->
      <IconFiberNew
        v-if="props.data.isNew"
        class="new-badge absolute -top-3 right-1 z-[1] text-2xl text-[var(--color-error)]"
      />
    </div>

    <!-- 分享卡片 -->
    <ShareCardDialog
      v-model:show="showShareCard"
      :image="getShareImage"
      :qrcodeContent="getShareLink"
      :qrcodeSize="64"
      :showShareLink="true"
      @close="handleCloseShare"
    >
      <div class="share-content-wrapper">
        <!-- 标题 -->
        <div class="share-title font-bold text-lg mb-2">
          {{ getShareContent }}
        </div>
        <!-- 描述 -->
        <div class="description text-sm break-words line-clamp-2">
          {{ props.data.description || props.data.summary }}
        </div>
        <!-- 来源和作者信息 -->
        <div v-if="!getShareImage" class="share-meta text-sm text-gray-400 mt-1">
          <span v-if="props.album?.title">来源：{{ props.album.title }}</span>
          <span v-if="props.album?.title && props.data.author"> - </span>
          <span v-if="props.data.author">{{ props.data.author }}</span>
        </div>
      </div>
    </ShareCardDialog>
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

  .card-header {
    .title {
      color: var(--origin-theme, var(--link-color));
    }
  }

  .description {
    color: var(--text-secondary);
    overflow-wrap: anywhere;
  }

  .card-footer {
    color: var(--text-tertiary);

    .share-btn {
      border: none;
      background: transparent;

      color: var(--origin-theme, var(--link-color));

      &:hover {
        background-color: rgba(
          var(--play-button-bg-color, --play-button-bg-color-default),
          0.1
        );
      }
    }
  }

  .new-badge {
    filter: drop-shadow(0 1px 2px rgba(var(--color-black-rgb), 0.2));
  }
}
</style>
