<script setup>
import { ref, reactive, watch, inject, computed } from 'vue';
import { NUpload } from 'naive-ui';

import ImageCard from './ImageCard.vue';
import PhoneCard from './PhoneCard.vue';
import PlayerCard from './PlayerCard.vue';
import TextCard from './TextCard.vue';
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

// 判断是否为文本卡片
const isTextCard = computed(() => cardControlState.cardType === SHARE_CARD_TYPE.TEXT);

// 卡片数据状态
const cardData = reactive({
  // 音乐卡片数据
  coverUrl: props.data.coverUrl || '',
  title: props.data.title || '歌曲标题',
  artist: props.data.artist || '艺术家',
  // 文本卡片数据
  content: props.data.content || '',
  backgroundColor: props.data.backgroundColor || '#ffffff',
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
    if (isTextCard.value) {
      // 文本卡片
      cardData.content = newData.content || '';
      cardData.backgroundColor = newData.backgroundColor || '#ffffff';
    } else {
      // 音乐卡片
      cardData.coverUrl = newData.coverUrl || '';
      cardData.title = newData.title || '歌曲标题';
      cardData.artist = newData.artist || '艺术家';

      // 更新封面 URL
      if (newData.coverUrl) {
        setImageUrl(newData.coverUrl);
      } else {
        setImageUrl('');
      }
    }

    // 更新二维码
    cardControlState.qrcode = newData.qrcode || '';
  },
  { deep: true }
);

// 使用图片上传 composable（仅音乐卡片使用）
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

// 监听上传成功，更新卡片数据（仅音乐卡片）
watch(imageUrl, (newUrl) => {
  if (newUrl && !isTextCard.value) {
    cardData.coverUrl = newUrl;
    emitChange();
  }
});

// 处理封面上传点击（音乐卡片）
const handleUploadCover = () => {
  triggerNaiveUpload(uploadRef);
};

// 处理文本内容变化（文本卡片）
const handleTextContentChange = (newContent) => {
  cardData.content = newContent;
  emitChange();
};

// 发送数据变化事件
const emitChange = () => {
  if (isTextCard.value) {
    // 文本卡片只发送相关数据
    emit('change', {
      content: cardData.content,
      backgroundColor: cardData.backgroundColor,
    });
  } else {
    // 音乐卡片只发送相关数据
    emit('change', {
      coverUrl: cardData.coverUrl,
      title: cardData.title,
      artist: cardData.artist,
    });
  }
};
</script>

<template>
  <div
    class="share-card-index-wrapper flex flex-col justify-center items-center gap-4 overflow-hidden"
  >
    <!-- 隐藏的上传组件（仅音乐卡片使用） -->
    <NUpload
      v-if="!isTextCard"
      ref="uploadRef"
      v-model:file-list="fileList"
      :max="1"
      accept="image/*"
      :show-file-list="false"
      style="display: none"
      @change="handleNaiveUploadChange"
    />

    <!-- 音乐类卡片 -->
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

    <!-- 文本卡片 -->
    <TextCard
      v-if="cardControlState.cardType === SHARE_CARD_TYPE.TEXT"
      :content="cardData.content"
      :background-color="cardData.backgroundColor"
      @update:content="handleTextContentChange"
    />
  </div>
</template>

<style lang="scss" scoped></style>
