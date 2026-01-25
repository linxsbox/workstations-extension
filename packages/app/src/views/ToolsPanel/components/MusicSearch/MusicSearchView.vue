<script setup>
import { ref, computed, onUnmounted } from 'vue';
import {
  NInput,
  NScrollbar,
  NEmpty,
  NSpin,
  NSwitch,
  useMessage,
} from 'naive-ui';
import { miguMusicService } from '@/services/music';
import MusicSongItem from './MusicSongItem.vue';

const message = useMessage();

// 搜索状态
const searchKeyword = ref('');
const isSearching = ref(false);
const searchResults = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);

// VIP 过滤开关（默认关闭）
const hideVip = ref(false);

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / pageSize.value);
});

// 过滤后的搜索结果（根据 hideVip 开关）
const filteredResults = computed(() => {
  if (!hideVip.value) {
    return searchResults.value;
  }
  return searchResults.value.filter(song => !song.isVip);
});

// 防抖和请求控制
let debounceTimer = null; // 防抖计时器
let searchAbortController = null; // 请求取消控制器

// 执行搜索
const performSearch = async (keyword, append = false) => {
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
      // 根据 append 参数决定是追加还是覆盖
      if (append) {
        searchResults.value = [...searchResults.value, ...result.data];
      } else {
        searchResults.value = result.data;
      }
      totalCount.value = result.totalCount || 0;
      if (result.data.length === 0) {
        message.info('没有找到相关歌曲');
      }
    } else {
      message.error(`搜索失败: ${result.error}`);
      searchResults.value = [];
      totalCount.value = 0;
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

  // 重置页码为第一页
  currentPage.value = 1;

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
    // 重置页码为第一页
    currentPage.value = 1;
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
  totalCount.value = 0;
  currentPage.value = 1;
};

// 处理加载更多（下一页）
const handleLoadMore = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    if (searchKeyword.value.trim()) {
      performSearch(searchKeyword.value, true); // append = true
    }
  }
};

// 组件卸载时清理
onUnmounted(() => {
  cancelDebounce();
  cancelSearch();
});
</script>

<template>
  <div class="music-search-view flex flex-col size-full gap-4">
    <!-- 搜索栏 -->
    <div class="search-bar relative flex flex-none items-center gap-3">
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
      <NSwitch v-model:value="hideVip" size="small" />

      <div class="total-bar absolute top-10 left-0 text-xs" v-if="totalCount > 0">
        <span class="p-1">{{ currentPage }} / {{ totalPages }}</span>
        <span
          class="ml-4 cursor-pointer text-blue-500 hover:text-blue-600"
          v-if="currentPage < totalPages && totalPages > 1"
          @click="handleLoadMore"
        >
          下一页
        </span>
      </div>
    </div>

    <!-- 搜索结果列表 - 卡片式布局 -->
    <div class="search-results flex-1 h-full overflow-hidden flex flex-col">
      <NSpin class="flex-1 h-full overflow-hidden" content-class="h-[inherit]" :show="isSearching" description="搜索中...">
        <NScrollbar>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            <template v-if="filteredResults.length > 0">
              <MusicSongItem
                v-for="song in filteredResults"
                :key="song.id"
                :song="song"
              />
            </template>
          </div>
          <NEmpty
            v-if="!isSearching && filteredResults.length === 0 && searchResults.length === 0"
            class="pt-10"
            description="输入关键词搜索您喜欢的音乐"
          />
          <NEmpty
            v-if="!isSearching && filteredResults.length === 0 && searchResults.length > 0"
            class="pt-10"
            description="所有结果都是VIP歌曲，已被过滤"
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
