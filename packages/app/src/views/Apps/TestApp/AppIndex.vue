<script setup>
import { handleError, ref } from 'vue';
import { NButton, NSpace, NCard, NDivider } from 'naive-ui';
import ShareCardDialog from '@/components/dialogs/ShareCardDialog/ShareCardDialog.vue';
import ShareMusicCard from '@/components/dialogs/ShareCardDialog/components/MusicCard/IndexView.vue';

const showText = ref(false);
const handleShowText = () => {
  showText.value = true;
};

// 保存卡片数据状态（持久化）
const cardData = ref({
  coverUrl: '',
  title: '歌曲标题',
  artist: '艺术家',
});

// 监听卡片数据变化
const handleCardChange = (newData) => {
  cardData.value = { ...cardData.value, ...newData };
};
</script>

<template>
  <div class="test-app p-8 min-h-screen bg-[var(--bg-primary)]">
    <div @click="handleShowText">测试 {{ showText }}</div>

    <ShareCardDialog v-model:show="showText">
      <ShareMusicCard :data="cardData" @change="handleCardChange" />
    </ShareCardDialog>
  </div>
</template>

<style lang="scss" scoped>
.test-app {
  // 使用项目的 CSS 变量
}
</style>
