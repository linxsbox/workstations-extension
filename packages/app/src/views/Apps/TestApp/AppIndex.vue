<script setup>
import { handleError, ref } from 'vue';
import { NButton, NSpace, NCard, NDivider } from 'naive-ui';
import ShareCardDialog from '@/components/dialogs/ShareCardDialog/ShareCardDialog.vue';
import ShareMusicCard from '@/components/dialogs/ShareCardDialog/components/MusicCard/IndexView.vue';

const showText = ref(false);
const handleShowText = () => {
  showText.value = true;
};
</script>

<template>
  <div class="test-app p-8 min-h-screen bg-[var(--bg-primary)]">
    <div @click="handleShowText">测试 {{ showText }}</div>

    <ShareCardDialog v-model:show="showText">
      <ShareMusicCard />
    </ShareCardDialog>
  </div>
</template>

<style lang="scss" scoped>
.test-app {
  // 使用项目的 CSS 变量
}
</style>
