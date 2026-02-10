<script setup>
import { ref, computed } from 'vue'
import { NModal, NCheckbox, NButton } from 'naive-ui'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  allLyrics: {
    type: Array,
    default: () => []
  },
  selectedLyrics: {
    type: Array,
    default: () => []
  },
  maxSelect: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

// 本地选中状态
const localSelected = ref([...props.selectedLyrics])

// 选中数量
const selectedCount = computed(() => localSelected.value.length)

// 判断是否选中
const isSelected = (lyric) => {
  return localSelected.value.includes(lyric)
}

// 切换选中状态
const toggleLyric = (lyric, checked) => {
  if (checked) {
    // 选中：检查是否超过最大数量
    if (localSelected.value.length < props.maxSelect) {
      localSelected.value.push(lyric)
    }
  } else {
    // 取消选中
    const index = localSelected.value.indexOf(lyric)
    if (index > -1) {
      localSelected.value.splice(index, 1)
    }
  }
}

// 确认选择
const handleConfirm = () => {
  emit('confirm', [...localSelected.value])
  emit('update:visible', false)
}

// 取消选择
const handleCancel = () => {
  // 恢复到初始状态
  localSelected.value = [...props.selectedLyrics]
  emit('update:visible', false)
}

// 监听弹窗打开，重置本地状态
const handleUpdateShow = (show) => {
  if (show) {
    localSelected.value = [...props.selectedLyrics]
  }
  emit('update:visible', show)
}
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    title="选择歌词"
    class="lyrics-modal w-[500px]"
    @update:show="handleUpdateShow"
  >
    <div class="lyrics-selector-content">
      <!-- 提示信息 -->
      <div class="tips-text text-sm text-gray-500 mb-4">
        最多选择 {{ maxSelect }} 行歌词（已选 {{ selectedCount }}/{{ maxSelect }}）
      </div>

      <!-- 歌词列表 -->
      <div class="lyrics-list flex flex-col gap-3 max-h-[400px] overflow-y-auto">
        <div
          v-for="(lyric, index) in allLyrics"
          :key="index"
          class="lyrics-item"
        >
          <NCheckbox
            :checked="isSelected(lyric)"
            :disabled="!isSelected(lyric) && selectedCount >= maxSelect"
            @update:checked="(checked) => toggleLyric(lyric, checked)"
          >
            <span class="lyric-text">{{ lyric }}</span>
          </NCheckbox>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" @click="handleConfirm">确定</NButton>
      </div>
    </template>
  </NModal>
</template>

<style lang="scss" scoped>
.lyrics-selector-content {
  padding: 8px 0;
}

.lyrics-list {
  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.lyrics-item {
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .lyric-text {
    font-size: 14px;
    line-height: 1.5;
  }
}

// 覆盖 NCheckbox 样式
:deep(.n-checkbox) {
  width: 100%;

  .n-checkbox__label {
    width: 100%;
  }
}
</style>
