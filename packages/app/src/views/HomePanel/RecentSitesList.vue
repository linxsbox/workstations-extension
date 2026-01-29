<script setup>
import { computed } from 'vue';
import { NEmpty, NCard } from 'naive-ui';
import { storeHome } from '@/stores/modules/home';

const homeStore = storeHome();

// 获取常访问网站列表
const topSites = computed(() => homeStore.topSites);

// 限制显示数量
const displayLimit = 10;
const displaySites = computed(() => topSites.value.slice(0, displayLimit));

// 打开网站
const handleOpenSite = (url) => {
  chrome.tabs.create({ url });
};
</script>

<template>
  <NCard class="recent-sites-card w-full">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="text-sm font-medium">近期访问</div>
      </div>
    </template>

    <div class="recent-sites-content pt-1">
      <div
        v-if="displaySites.length > 0"
        class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3"
      >
        <a
          v-for="site in displaySites"
          :key="site.url"
          class="site-item flex items-center gap-2 p-2 rounded-lg border cursor-pointer"
          :href="site.url"
          :aria-label="`打开 ${site.title}`"
          @click.prevent="handleOpenSite(site.url)"
        >
          <div
            class="site-favicon flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border bg-gray-150"
          >
            <img
              :src="site.favicon"
              :alt="site.title"
              class="w-4 h-4 object-contain"
            />
          </div>
          <div class="site-info flex-1 min-w-0 flex flex-col">
            <div
              class="site-title text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {{ site.title }}
            </div>
            <div
              class="site-domain text-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {{ site.domainUrl }}
            </div>
          </div>
        </a>
      </div>
      <NEmpty v-else description="暂无访问记录" size="small" />
    </div>
  </NCard>
</template>

<style lang="scss" scoped>
.recent-sites-card {
  .site-item {
    background: var(--bg-secondary);
    border-color: var(--border-color);
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      background: var(--bg-tertiary);
      border-color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .site-favicon {
    border-color: var(--border-color);
  }

  .site-title {
    color: var(--text-primary);
  }

  .site-domain {
    color: var(--text-tertiary);
  }
}
</style>
