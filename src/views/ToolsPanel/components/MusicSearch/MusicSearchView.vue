<script setup>
import { ref, onUnmounted } from 'vue';
import {
  NInput,
  NScrollbar,
  NEmpty,
  NSpin,
  useMessage,
} from 'naive-ui';
import { debounce } from '@linxs/toolkit';
import { miguMusicService } from '@/services/music';
import MusicSongItem from './MusicSongItem.vue';

const message = useMessage();

// 搜索状态
const searchKeyword = ref('');
const isSearching = ref(false);
const searchResults = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);

// 防抖和请求控制
let debounceTimer = null; // 防抖计时器
let searchAbortController = null; // 请求取消控制器

// 执行搜索
const performSearch = async (keyword) => {
  if (!keyword.trim()) {
    // 如果输入为空，清空结果
    searchResults.value = [];
    return;
  }

  // 取消之前的搜索请求
  if (searchAbortController) {
    searchAbortController.abort();
  }

  // 创建新的 AbortController
  searchAbortController = new AbortController();
  const currentController = searchAbortController;

  isSearching.value = true;

  try {
    const result = await miguMusicService.searchSongs(
      keyword.trim(),
      currentPage.value,
      pageSize.value,
      currentController.signal
    );

    // 检查请求是否被取消
    if (currentController.signal.aborted) {
      return;
    }

    if (result.success) {
      searchResults.value = result.data;
      if (result.data.length === 0) {
        message.info('没有找到相关歌曲');
      }
    } else {
      message.error(`搜索失败: ${result.error}`);
      searchResults.value = [];
    }
  } catch (error) {
    // 忽略取消请求的错误
    if (error.name === 'AbortError') {
      console.log('搜索已取消');
      return;
    }
    console.error('搜索出错:', error);
    message.error('搜索出错，请稍后重试');
    searchResults.value = [];
  } finally {
    // 只有当前控制器仍然是活动控制器时才重置 loading 状态
    if (currentController === searchAbortController) {
      isSearching.value = false;
    }
  }
};

// 取消防抖计时器
const cancelDebounce = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
};

// 取消搜索请求
const cancelSearch = () => {
  if (searchAbortController) {
    searchAbortController.abort();
    searchAbortController = null;
  }
};

// 处理输入事件（带防抖）
const handleInput = () => {
  const keyword = searchKeyword.value;

  // 取消之前的防抖
  cancelDebounce();

  if (!keyword.trim()) {
    // 输入为空，取消搜索并清空结果
    cancelSearch();
    searchResults.value = [];
    return;
  }

  // 启动新的防抖
  debounceTimer = setTimeout(() => {
    performSearch(keyword);
  }, 750);
};

// 处理回车事件（立即搜索）
const handleEnter = () => {
  const keyword = searchKeyword.value;

  // 取消防抖，立即搜索
  cancelDebounce();

  if (keyword.trim()) {
    performSearch(keyword);
  }
};

// 处理清空事件
const handleClear = () => {
  // 取消防抖和搜索
  cancelDebounce();
  cancelSearch();

  // 清空结果
  searchResults.value = [];
};

// 组件卸载时清理
onUnmounted(() => {
  cancelDebounce();
  cancelSearch();
});
</script>

<template>
  <div class="music-search-view flex flex-col w-full h-full gap-4">
    <!-- 搜索栏 -->
    <div class="search-bar flex-none">
      <NInput
        v-model:value="searchKeyword"
        @input="handleInput"
        @keyup.enter="handleEnter"
        @clear="handleClear"
        placeholder="输入歌曲、歌手或专辑名称，即时搜索（回车立即搜索）..."
        size="large"
        :disabled="isSearching"
        :loading="isSearching"
        clearable
      />
    </div>

    <!-- 搜索结果列表 - 卡片式布局 -->
    <div class="search-results flex-1 h-full overflow-hidden">
      <NSpin class="h-full" content-class="h-[inherit]" :show="isSearching" description="搜索中...">
        <NScrollbar>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 p-1">
            <template v-if="searchResults.length > 0">
              <MusicSongItem
                v-for="song in searchResults"
                :key="song.id"
                :song="song"
              />
            </template>
          </div>
          <NEmpty
            v-if="!isSearching && searchResults.length === 0"
            class="pt-10"
            description="输入关键词搜索您喜欢的音乐"
          />
        </NScrollbar>
      </NSpin>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-search-view {
  background-color: var(--bg-primary);

  .search-bar {
    flex-shrink: 0;
  }

  .search-results {
    position: relative;
  }
}
</style>
