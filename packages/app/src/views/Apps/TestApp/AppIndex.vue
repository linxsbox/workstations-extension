<script setup>
import { ref } from 'vue';
import ShareCardDialog from '@/components/dialogs/ShareCardDialog/ShareCardDialog.vue';
import ShareCard from '@/components/dialogs/ShareCardDialog/components/Cards/IndexView.vue';
import { CARD_GROUP_TYPE } from '@/constants/shareCard';

const showText = ref(false);
const handleShowText = () => {
  showText.value = true;
};

// 保存卡片数据状态（持久化）
const cardData = ref({
  coverUrl: '',
  title: '歌曲标题',
  artist: '艺术家',
  qrcode: 'https://github.com/linxsbox',
});

// 文本卡片数据
const textData = ref({
  content: '这是一段测试文本\n\n可以多行显示\n支持换行编辑',
  backgroundColor: '#ffffff',
  qrcode: 'https://github.com/linxsbox',
});

// 监听卡片数据变化
const handleCardChange = (newData) => {
  cardData.value = { ...cardData.value, ...newData };
};

const handleTextChange = (newData) => {
  textData.value = { ...textData.value, ...newData };
};
</script>

<template>
  <div class="test-app p-8 min-h-screen bg-[var(--bg-primary)]">
    <div @click="handleShowText">测试 {{ showText }}</div>

    <ShareCardDialog v-model:show="showText" :card-groups="[CARD_GROUP_TYPE.MUSIC, CARD_GROUP_TYPE.TEXT]">
      <ShareCard :data="cardData" @change="handleCardChange" />
      <ShareCard :data="textData" @change="handleTextChange" />
    </ShareCardDialog>
  </div>
</template>

<style lang="scss" scoped>
</style>
