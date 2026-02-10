<script setup>
import { ref, reactive } from 'vue';
import { NUpload, useMessage } from 'naive-ui';

import ImageCard from './ImageCard.vue';
import PhoneCard from './PhoneCard.vue';
import PlayerCard from './PlayerCard.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  type: {
    type: String,
    default: 'image',
  },
});

const emit = defineEmits(['change']);

const TYPE_CARD = {
  Image: 'image',
  Phone: 'phone',
  Player: 'player',
};

// 卡片数据状态
const cardData = reactive({
  coverUrl: props.data.coverUrl || '',
  title: props.data.title || '歌曲标题',
  artist: props.data.artist || '艺术家',
});

// 上传组件引用
const uploadRef = ref(null);

// 文件列表
const fileList = ref([]);

// 处理封面上传点击
const handleUploadCover = () => {
  // 清空文件列表，确保可以重复上传
  fileList.value = [];
  // 触发隐藏的上传组件
  uploadRef.value?.$el.querySelector('input[type="file"]')?.click();
};

// 处理文件上传
const handleFileChange = ({ file }) => {
  if (file.file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      cardData.coverUrl = e.target.result;
      emitChange();
      // 上传完成后清空文件列表
      fileList.value = [];
    };
    reader.readAsDataURL(file.file);
  }
};

// 发送数据变化事件
const emitChange = () => {
  emit('change', { ...cardData });
};
</script>

<template>
  <div
    class="share-music-card-wrapper flex flex-col justify-center items-center gap-4 overflow-hidden"
  >
    <!-- 隐藏的上传组件 -->
    <NUpload
      ref="uploadRef"
      v-model:file-list="fileList"
      :max="1"
      accept="image/*"
      :show-file-list="false"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- 卡片类型 -->
    <ImageCard
      v-if="type === TYPE_CARD.Image"
      :cover-url="cardData.coverUrl"
      @upload-cover="handleUploadCover"
    />
    <PhoneCard
      v-if="type === TYPE_CARD.Phone"
      :cover-url="cardData.coverUrl"
      @upload-cover="handleUploadCover"
    />
    <PlayerCard
      v-if="type === TYPE_CARD.Player"
      :cover-url="cardData.coverUrl"
      @upload-cover="handleUploadCover"
    />
  </div>
</template>

<style lang="scss" scoped></style>
