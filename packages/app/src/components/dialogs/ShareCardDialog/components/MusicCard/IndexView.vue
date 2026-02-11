<script setup>
import { ref, reactive, watch, inject } from 'vue';
import { NUpload } from 'naive-ui';

import ImageCard from './ImageCard.vue';
import PhoneCard from './PhoneCard.vue';
import PlayerCard from './PlayerCard.vue';
import { useImageUpload } from '@/composables/shareCard/useImageUpload';
import { SHARE_CARD_TYPE } from '@/constants/shareCard';
import { DEFAULT_CARD_CONTROL_STATE } from '@/composables/shareCard/useControlPanel';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['change']);

// 注入共享的卡片控制状态（提供默认值）
const cardControlState = inject('cardControlState', DEFAULT_CARD_CONTROL_STATE);

// 卡片数据状态
const cardData = reactive({
  coverUrl: props.data.coverUrl || '',
  title: props.data.title || '歌曲标题',
  artist: props.data.artist || '艺术家',
});

// 初始化二维码（如果有）
if (props.data.qrcode) {
  cardControlState.qrcode = props.data.qrcode;
}

// 监听 props.data 变化，同步更新状态
watch(
  () => props.data,
  (newData) => {
    // 更新卡片数据
    cardData.coverUrl = newData.coverUrl || '';
    cardData.title = newData.title || '歌曲标题';
    cardData.artist = newData.artist || '艺术家';

    // 更新二维码
    cardControlState.qrcode = newData.qrcode || '';

    // 更新封面 URL
    if (newData.coverUrl) {
      setImageUrl(newData.coverUrl);
    } else {
      setImageUrl('');
    }
  },
  { deep: true }
);

// 使用图片上传 composable
const {
  imageUrl,
  fileList,
  handleNaiveUploadChange,
  triggerNaiveUpload,
  setImageUrl,
} = useImageUpload({
  maxSize: 5 * 1024 * 1024,
  showMessage: true,
});

// 上传组件引用
const uploadRef = ref(null);

// 初始化时，如果 cardData 有 coverUrl，同步到 imageUrl
if (cardData.coverUrl) {
  setImageUrl(cardData.coverUrl);
}

// 监听上传成功，更新卡片数据
watch(imageUrl, (newUrl) => {
  if (newUrl) {
    cardData.coverUrl = newUrl;
    emitChange();
  }
});

// 处理封面上传点击
const handleUploadCover = () => {
  triggerNaiveUpload(uploadRef);
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
      @change="handleNaiveUploadChange"
    />

    <!-- 卡片类型 -->
    <ImageCard
      v-if="cardControlState.cardType === SHARE_CARD_TYPE.IMAGE"
      :cover-url="cardData.coverUrl"
      :title="cardData.title"
      :artist="cardData.artist"
      @upload-cover="handleUploadCover"
    />
    <PhoneCard
      v-if="cardControlState.cardType === SHARE_CARD_TYPE.PHONE"
      :cover-url="cardData.coverUrl"
      :title="cardData.title"
      :artist="cardData.artist"
      @upload-cover="handleUploadCover"
    />
    <PlayerCard
      v-if="cardControlState.cardType === SHARE_CARD_TYPE.PLAYER"
      :cover-url="cardData.coverUrl"
      :title="cardData.title"
      :artist="cardData.artist"
      @upload-cover="handleUploadCover"
    />
  </div>
</template>

<style lang="scss" scoped></style>
