<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { storePlayer } from "@/stores/modules/player";
import { ViewMode } from "@/stores/modules/player/types";
import { miguMusicService } from "@/services/music";
import http from "@/utils/http";

const store = storePlayer();

// 歌词数据
const lyrics = ref([]);
const currentLyricIndex = ref(-1);
const isLoading = ref(false);
const error = ref(null);

// 歌词容器引用
const lyricContainerRef = ref(null);

// 当前播放时间
const currentTime = computed(() => store.currentTime);

// 当前播放的歌曲
const currentTrack = computed(() => store.currentQueueTrack);

// 当前视图模式
const viewMode = computed(() => store.viewMode);

// 上一次获取歌词的歌曲标识
const lastFetchedTrackId = ref(null);

// 是否显示状态提示（加载/错误/无歌词）
const showStatus = computed(
  () => isLoading.value || error.value || !lyrics.value.length
);

/**
 * 获取歌词
 */
const fetchLyric = async (track) => {
  if (!track) {
    lyrics.value = [];
    error.value = "无歌曲信息";
    return;
  }

  // 如果是同一首歌且已有歌词，跳过
  const trackId = track.copyrightId || track.lyricUrl || track.title;
  if (trackId === lastFetchedTrackId.value && lyrics.value.length > 0) {
    console.log("歌词已缓存，跳过获取");
    return;
  }

  console.log("开始获取歌词, track:", track);
  isLoading.value = true;
  error.value = null;

  try {
    let lyricText = "";

    // 优先使用 lyricUrl
    if (track.lyricUrl) {
      console.log("使用 lyricUrl 获取歌词:", track.lyricUrl);
      const response = await http.get(track.lyricUrl);
      // 如果响应是字符串直接使用，否则尝试转换
      lyricText =
        typeof response === "string" ? response : String(await response.text());
    } else if (track.copyrightId) {
      console.log("使用 API 获取歌词, copyrightId:", track.copyrightId);
      const result = await miguMusicService.getLyric(track.copyrightId);
      console.log("歌词获取结果:", result);

      if (!result.success || !result.data) {
        lyrics.value = [];
        error.value = result.error || "获取歌词失败";
        return;
      }

      lyricText = result.data.lyric;
    } else {
      lyrics.value = [];
      error.value = "无歌词信息";
      return;
    }

    // 解析歌词
    const parsedLyric = parseLyric(lyricText);
    lyrics.value = parsedLyric;
    currentLyricIndex.value = -1;
    lastFetchedTrackId.value = trackId;
  } catch (err) {
    console.error("获取歌词失败:", err);
    lyrics.value = [];
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

/**
 * 解析歌词文本为时间轴数组
 */
const parseLyric = (lyricText) => {
  if (!lyricText) return [];

  const lines = lyricText.split("\n");
  const lyricArray = [];

  // 正则匹配时间标签 [mm:ss.ms] 或 [mm:ss]
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  lines.forEach((line) => {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length === 0) return;

    // 提取歌词文本（去除所有时间标签）
    const text = line.replace(timeRegex, "").trim();
    if (!text) return;

    // 一行可能有多个时间标签
    matches.forEach((match) => {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;

      const time = minutes * 60 + seconds + milliseconds / 1000;

      lyricArray.push({
        time,
        text,
      });
    });
  });

  // 按时间排序
  lyricArray.sort((a, b) => a.time - b.time);

  return lyricArray;
};

/**
 * 根据当前时间更新歌词索引
 */
const updateCurrentLyric = (time) => {
  if (!lyrics.value.length) return;

  // 找到当前时间对应的歌词索引
  let index = -1;
  for (let i = 0; i < lyrics.value.length; i++) {
    if (time >= lyrics.value[i].time) {
      index = i;
    } else {
      break;
    }
  }

  if (index !== currentLyricIndex.value) {
    currentLyricIndex.value = index;
    scrollToCurrentLyric();
  }
};

/**
 * 滚动到当前歌词
 */
const scrollToCurrentLyric = () => {
  nextTick(() => {
    if (!lyricContainerRef.value || currentLyricIndex.value < 0) return;

    const container = lyricContainerRef.value;
    const currentLine = container.querySelector(".lyric-line.active");

    if (currentLine) {
      const containerHeight = container.clientHeight;
      const lineOffsetTop = currentLine.offsetTop;
      const lineHeight = currentLine.clientHeight;

      // 滚动到中间位置
      const scrollTop = lineOffsetTop - containerHeight / 2 + lineHeight / 2;

      container.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  });
};

// 监听当前播放时间
watch(currentTime, (newTime) => {
  updateCurrentLyric(newTime);
});

// 监听当前歌曲变化
watch(
  currentTrack,
  (newTrack, oldTrack) => {
    console.log("歌曲变化 - 新:", newTrack, "旧:", oldTrack);

    // 只在标准模式下加载歌词
    if (viewMode.value !== ViewMode.STANDARD) {
      console.log("非标准模式，跳过加载歌词");
      return;
    }

    if (newTrack) {
      fetchLyric(newTrack);
    } else {
      console.log("没有歌曲，清空歌词");
      lyrics.value = [];
      currentLyricIndex.value = -1;
      lastFetchedTrackId.value = null;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="lyrics-area flex-1 w-full max-w-3xl overflow-hidden p-5">
    <div
      ref="lyricContainerRef"
      class="lyric-panel size-full relative py-5 rounded-lg overflow-y-auto overflow-x-hidden shadow-md"
      :class="{ 'backdrop-blur-xl lyric-success': !showStatus }"
    >
      <!-- 状态提示容器（加载/错误/无歌词） -->
      <div
        v-if="showStatus"
        class="absolute top-0 left-0 right-0 bottom-0 m-auto flex justify-center items-center"
      >
        <!-- 加载中 -->
        <div
          v-if="isLoading"
          class="lyric-loading flex items-center justify-center h-full text-xl animate-pulse"
        >
          加载歌词中...
        </div>

        <!-- 错误提示 -->
        <div
          v-else-if="error"
          class="lyric-error flex items-center justify-center h-full text-sm"
        >
          {{ error }}
        </div>

        <!-- 无歌词 -->
        <div
          v-else
          class="lyric-null flex items-center justify-center h-full text-sm"
        >
          暂无歌词
        </div>
      </div>

      <!-- 歌词列表 -->
      <div v-else class="lyric-list flex flex-col items-center px-5">
        <!-- 顶部占位，让第一句歌词显示在中间 -->
        <div class="lyric-spacer"></div>

        <div
          v-for="(line, index) in lyrics"
          :key="index"
          class="lyric-line py-2 text-base leading-relaxed text-center transition-all duration-300 cursor-default select-none"
          :class="{ active: index === currentLyricIndex }"
        >
          {{ line.text }}
        </div>

        <!-- 底部占位，让最后一句歌词可以滚动到中间 -->
        <div class="lyric-spacer"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lyrics-area {
  .lyric-panel {
    color: var(--player-lyrics-color);
    background-color: var(--player-lyrics-bg);
    border: 1px solid var(--player-lyrics-border-bg);

    // 隐藏滚动条但保持可滚动
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE/Edge

    &::-webkit-scrollbar {
      display: none; // Chrome/Safari
    }

    .lyric-list {
      text-shadow: 2px 2px 2px var(--player-lyrics-text-bg);

      .lyric-line {
        color: var(--player-lyrics-color);
        font-size: 16px;
        font-weight: normal;
        transform: scale(1);

        &:hover {
          color: var(--player-lyrics-hover-color);
        }

        &.active {
          color: var(--player-color-default);
          font-size: 18px;
          font-weight: 500;
          transform: scale(1.05);
        }
      }
    }

    .lyric-loading {
      color: var(--player-color-default);
    }

    .lyric-null {
      color: var(--player-header-hover-color);
    }

    .lyric-error {
      color: var(--player-header-hover-color);
    }
  }
}
</style>
