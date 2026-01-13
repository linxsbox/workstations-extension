<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import PlayButton from '@/components/player/PlayButton.vue';
import AddToQueueButton from '@/components/player/AddToQueueButton.vue';
import IconPlaylistAdd from '@/components/common/Icons/IconPlaylistAdd.vue';
import { storePlayer } from '@/stores/modules/player';
import { miguMusicService } from '@/services/music';

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
      album: props.song.album || null,
      cover: props.song.cover || '',
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

// 处理添加到队列的点击事件
const handleAddToQueueClick = async () => {
  if (isLoadingTrack.value) return;

  try {
    await buildTrackData();
  } catch (error) {
    console.error('获取音乐链接失败:', error);
    message.error(`获取音乐链接失败: ${error.message}`);
  }
};

// 添加到队列成功
const handleAddToQueueSuccess = (track) => {
  message.success(`已添加到播放列表: ${track.title}`);
};

// 添加到队列重复
const handleAddToQueueDuplicate = (track) => {
  message.warning(`${track.title} 已在播放列表中`);
};

// 添加到队列失败
const handleAddToQueueError = (error) => {
  message.error(`添加失败: ${error?.message || '未知错误'}`);
};
</script>

<template>
  <div class="music-song-item flex flex-col rounded-lg overflow-hidden">
    <!-- 封面区域 -->
    <div class="song-cover-wrapper relative w-full pt-[100%] bg-[var(--bg-secondary)]">
      <img
        v-if="song.cover"
        :src="song.cover"
        :alt="song.name"
        class="absolute top-0 left-0 w-full h-full object-cover"
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
      <div class="song-name text-xs font-bold truncate" :title="song.name">
        {{ song.name }}
      </div>
      <div class="song-artist text-[10px] text-[var(--text-secondary)] truncate" :title="song.artist">
        {{ song.artist }}
      </div>

      <!-- 操作按钮 -->
      <div class="song-actions flex items-center justify-end gap-2 mt-1">
        <!-- 只有当 track 已缓存时才显示 AddToQueueButton -->
        <AddToQueueButton
          v-if="cachedTrack"
          class="text-base text-[var(--text-secondary)] hover:text-[var(--primary-color)]"
          :track="cachedTrack"
          @success="handleAddToQueueSuccess"
          @duplicate="handleAddToQueueDuplicate"
          @error="handleAddToQueueError"
        />
        <!-- 否则显示一个加载按钮，点击后预加载 track -->
        <button
          v-else
          class="flex items-center justify-center bg-transparent border-none p-0 text-base text-[var(--text-secondary)] cursor-pointer transition-all duration-200 hover:text-[var(--primary-color)] hover:scale-110"
          :class="{ 'opacity-30 cursor-not-allowed': isLoadingTrack }"
          :disabled="isLoadingTrack"
          @click.stop="handleAddToQueueClick"
          title="加入播放列表"
        >
          <IconPlaylistAdd />
        </button>
      </div>
    </div>
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
}
</style>
