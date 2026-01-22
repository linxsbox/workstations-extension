<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import PlayButton from '@/components/player/PlayButton.vue';
import IconPlaylistAdd from '@/components/common/Icons/IconPlaylistAdd.vue';
import IconShare from '@/components/common/Icons/IconShare.vue';
import ShareCardDialog from '@/components/dialogs/ShareCardDialog/ShareCardDialog.vue';
import { storePlayer } from '@/stores/global/player';
import { miguMusicService } from '@/services/music';
import { getCoverImageFormats, tryLoadCoverImage } from '@/utils/image';

const props = defineProps({
  song: {
    type: Object,
    required: true,
  },
});

const store = storePlayer();
const { getPlayStatus } = storeToRefs(store);
const message = useMessage();

// 缓存的轨道数据
const cachedTrack = ref(null);
const isLoadingTrack = ref(false);

// 分享卡片状态
const showShareCard = ref(false);

// 封面图片相关
const coverFormatIndex = ref(0);
const coverFormats = computed(() => getCoverImageFormats(props.song.cover));
const currentCoverUrl = ref('');
const isLoadingCover = ref(false);
const hasOriginalExtension = computed(() => /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(props.song.cover || ''));

// 初始化封面
const initCover = async () => {
  if (coverFormats.value.length > 0) {
    await tryLoadNextCoverFormat();
  }
};

// 尝试加载下一个封面格式
const tryLoadNextCoverFormat = async () => {
  if (coverFormatIndex.value >= coverFormats.value.length) {
    // 所有格式都失败了
    currentCoverUrl.value = '';
    isLoadingCover.value = false;
    return;
  }

  const url = coverFormats.value[coverFormatIndex.value];
  const isLastAttempt = coverFormatIndex.value === coverFormats.value.length - 1;

  isLoadingCover.value = true;

  try {
    // 尝试加载图片，如果是最后一次尝试且原始 URL 无扩展名则转换为 base64
    const loadedUrl = await tryLoadCoverImage(url, isLastAttempt, hasOriginalExtension.value);
    currentCoverUrl.value = loadedUrl;
  } catch (error) {
    // 加载失败，尝试下一个格式
    coverFormatIndex.value++;
    await tryLoadNextCoverFormat();
  } finally {
    isLoadingCover.value = false;
  }
};

// 初始化时加载封面
initCover();

// 处理封面加载失败
const handleCoverError = async () => {
  // 尝试下一个格式
  if (coverFormatIndex.value < coverFormats.value.length - 1) {
    coverFormatIndex.value++;
    await tryLoadNextCoverFormat();
  }
};

// 构建轨道数据
const buildTrackData = async () => {
  // 如果已经缓存，直接返回
  if (cachedTrack.value) {
    return cachedTrack.value;
  }

  isLoadingTrack.value = true;

  try {
    // 获取音乐播放链接
    const urlResult = await miguMusicService.getMusicUrl(
      props.song.contentId,
      props.song.copyrightId,
      miguMusicService.QUALITY.HQ
    );

    if (!urlResult.success) {
      throw new Error('获取音乐链接失败');
    }

    const trackData = {
      title: props.song.name,
      src: urlResult.url,
      artist: props.song.artist,
      album: props.song.album ? {
        title: props.song.album,
        image: props.song.cover || '',
      } : null,
      cover: props.song.cover || '',
      copyrightId: props.song.copyrightId,
      lyricUrl: props.song.lyricUrl,
    };

    // 缓存轨道数据
    cachedTrack.value = trackData;

    return trackData;
  } finally {
    isLoadingTrack.value = false;
  }
};

// 检查是否正在播放
const isPlay = computed(() => {
  return (
    getPlayStatus.value.title === props.song.name &&
    getPlayStatus.value.isPlaying
  );
});

// 点击播放
const clickPlay = async () => {
  try {
    // 检查是否是 VIP 歌曲
    if (props.song.isVip) {
      message.warning('VIP 版本音乐无法播放');
      return;
    }

    // 如果是当前播放的曲目
    if (getPlayStatus.value.title === props.song.name) {
      if (getPlayStatus.value.isError) {
        store.resetPlayer();
        return;
      }
      store.togglePlay();
      return;
    }

    // 构建轨道数据并播放
    const trackData = await buildTrackData();
    store.addAndPlay(trackData);
    store.showPlayer();
  } catch (error) {
    console.error('播放失败:', error);
    message.error(`播放失败: ${error.message}`);
  }
};

// 点击暂停
const clickPause = () => {
  if (getPlayStatus.value.title === props.song.name) {
    store.pause();
  }
};

// 处理添加到播放列表
const handleAddToQueue = async () => {
  if (isLoadingTrack.value) return;

  // 检查是否是 VIP 歌曲
  if (props.song.isVip) {
    message.warning('VIP 版本音乐无法添加到播放列表');
    return;
  }

  try {
    // 构建轨道数据
    const trackData = await buildTrackData();

    // 添加到播放列表，addToQueue 会返回 true（成功）或 false（已存在）
    const success = store.addToQueue(trackData);

    if (success) {
      message.success(`已添加到播放列表: ${trackData.title}`);
    } else {
      message.warning(`${trackData.title} 已在播放列表中`);
    }
  } catch (error) {
    console.error('添加到播放列表失败:', error);
    message.error(`添加失败: ${error.message}`);
  }
};

// 二维码内容（可以是歌曲链接或其他信息）
const qrcodeContent = computed(() => {
  // 这里可以根据需要生成歌曲链接或其他内容
  return `https://music.migu.cn/v3/music/song/${props.song.contentId}`;
});

// 处理分享按钮点击
const handleShare = () => {
  showShareCard.value = true;
};
</script>

<template>
  <div class="music-song-item flex flex-col rounded-lg overflow-hidden">
    <!-- 封面区域 -->
    <div class="song-cover-wrapper relative w-full pt-[100%] bg-[var(--bg-secondary)]">
      <img
        v-if="currentCoverUrl && !isLoadingCover"
        :src="currentCoverUrl"
        :alt="song.name"
        class="absolute top-0 left-0 w-full h-full object-cover"
        @error="handleCoverError"
      />
      <!-- 播放按钮覆盖层 -->
      <div class="play-overlay absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/40">
        <PlayButton
          class="text-5xl text-white drop-shadow-lg"
          @play="clickPlay"
          @pause="clickPause"
          :isPlay="isPlay"
        />
      </div>
    </div>

    <!-- 歌曲信息区域 -->
    <div class="song-info-wrapper flex-1 flex flex-col gap-1 p-2">
      <div class="song-name flex items-center gap-1 text-xs font-bold truncate" :title="song.name">
        <span v-if="song.isVip" class="vip-badge flex-shrink-0 px-1 py-0.5 text-[8px] font-bold rounded text-white">VIP</span>
        <span class="truncate">{{ song.name }}</span>
      </div>
      <div class="song-artist text-[10px] text-[var(--text-secondary)] truncate" :title="song.artist">
        {{ song.artist }}
      </div>

      <!-- 操作按钮 -->
      <div class="song-actions flex items-center justify-end gap-2">
        <!-- 分享按钮 -->
        <button
          class="flex items-center justify-center bg-transparent border-none p-0 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--primary-color)] transition-colors"
          @click.stop="handleShare"
          title="分享"
        >
          <IconShare class="text-xl" />
        </button>

        <!-- 添加到播放列表按钮 -->
        <button
          class="flex items-center justify-center bg-transparent border-none p-0 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--primary-color)] transition-colors"
          :class="{ 'opacity-30 cursor-not-allowed': isLoadingTrack }"
          :disabled="isLoadingTrack"
          @click.stop="handleAddToQueue"
          title="加入播放列表"
        >
          <IconPlaylistAdd class="text-xl" />
        </button>
      </div>
    </div>

    <!-- 分享卡片 -->
    <ShareCardDialog
      v-if="currentCoverUrl"
      v-model:show="showShareCard"
      :image="currentCoverUrl"
      :qrcode-content="qrcodeContent"
    >
      <div class="share-content-wrapper">
        <div class="song-info artist pb-2">
          <div class="font-bold">《{{ props.song.name }}》 {{ props.song.artist }}</div>
          <div class="text-sm text-gray-500" v-if="props.song.album">专辑：{{ props.song.album }}</div>
        </div>
        <div class="content text-sm" contenteditable></div>
      </div>
    </ShareCardDialog>
  </div>
</template>

<style lang="scss" scoped>
.music-song-item {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .song-cover-wrapper {
    position: relative;

    img {
      transition: transform 0.3s;
    }

    &:hover img {
      transform: scale(1.05);
    }
  }

  .song-info-wrapper {
    background-color: var(--bg-primary);
  }

  .vip-badge {
    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
    box-shadow: 0 1px 3px rgba(251, 191, 36, 0.3);
  }
}
</style>
