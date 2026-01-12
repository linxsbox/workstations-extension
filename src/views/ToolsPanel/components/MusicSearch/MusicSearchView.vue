<script setup>
import { ref, watch } from 'vue';
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
const isInputLocked = ref(false); // 输入框锁定状态

// 执行搜索
const performSearch = async (keyword) => {
  if (!keyword.trim()) {
    // 如果输入为空，清空结果
    searchResults.value = [];
    return;
  }

  isSearching.value = true;

  try {
    const result = await miguMusicService.searchSongs(
      keyword.trim(),
      currentPage.value,
      pageSize.value
    );

    if (result.success) {
      searchResults.value = result.data;
      if (result.data.length === 0) {
        message.info('没有找到相关歌曲');
      }

      // 搜索成功后锁定输入框 5 秒
      isInputLocked.value = true;
      setTimeout(() => {
        isInputLocked.value = false;
      }, 5000);
    } else {
      message.error(`搜索失败: ${result.error}`);
      searchResults.value = [];
    }
  } catch (error) {
    console.error('搜索出错:', error);
    message.error('搜索出错，请稍后重试');
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

// 创建防抖搜索函数
const debouncedSearch = debounce((keyword) => {
  performSearch(keyword);
}, 750);

// 监听搜索关键词变化
watch(searchKeyword, (newKeyword) => {
  if (newKeyword.trim()) {
    // 有内容时触发搜索
    debouncedSearch(newKeyword);
  } else {
    // 清空内容时清空结果
    searchResults.value = [];
  }
});
</script>

<template>
  <div class="music-search-view flex flex-col w-full h-full gap-4">
    <!-- 搜索栏 -->
    <div class="search-bar flex-none">
      <NInput
        v-model:value="searchKeyword"
        placeholder="输入歌曲、歌手或专辑名称，即时搜索..."
        size="large"
        :disabled="isInputLocked"
        :loading="isSearching"
        clearable
      >
        <template #suffix>
          <span v-if="isInputLocked" class="text-xs text-[var(--text-tertiary)]">
            {{ isSearching ? '搜索中...' : '请等待 5 秒...' }}
          </span>
        </template>
      </NInput>
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
