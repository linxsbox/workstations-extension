<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { SETTING_TYPES } from '@/stores/modules/settings/types'
import { storeSettings } from '@/stores/modules/settings'
import SettingRadio from './SettingRadio.vue'
import SettingSwitch from './SettingSwitch.vue'
import SettingSelect from './SettingSelect.vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  }
})

const store = storeSettings()

// 获取当前值
const currentValue = computed(() => {
  return props.config.storeKey ? store[props.config.storeKey] : null
})

// 处理值变化
const handleValueChange = (value) => {
  if (props.config.action && store[props.config.action]) {
    store[props.config.action](value)
  }
}

// 动态加载自定义组件
const customComponent = computed(() => {
  if (props.config.type === SETTING_TYPES.CUSTOM && props.config.component) {
    // 处理别名路径，转换为相对路径
    let componentPath = props.config.component

    // 如果使用了 @/ 别名，转换为相对路径
    if (componentPath.startsWith('@/components/dialogs/SettingDialog/components/')) {
      // 转换为相对当前文件的路径
      componentPath = componentPath.replace(
        '@/components/dialogs/SettingDialog/components/',
        './'
      )
    } else if (componentPath.startsWith('@/')) {
      // 其他 @/ 别名路径，转换为从 src 开始的相对路径
      componentPath = componentPath.replace('@/', '../../../../')
    }

    // 使用动态 import
    return defineAsyncComponent(() =>
      import(/* @vite-ignore */ componentPath).catch(err => {
        console.error('Failed to load component:', componentPath, err)
        // 返回一个错误占位组件
        return {
          template: '<div class="text-sm text-red-500">组件加载失败: {{ error }}</div>',
          data: () => ({ error: err.message })
        }
      })
    )
  }
  return null
})
</script>

<template>
  <div class="setting-item">
    <!-- 设置项标题 -->
    <h3 class="setting-label text-base font-medium mb-3">
      {{ config.title }}
    </h3>

    <!-- 设置项描述（可选） -->
    <p v-if="config.description" class="text-sm text-gray-500 mb-2 px-5">
      {{ config.description }}
    </p>

    <div class="px-5">
      <!-- 未启用状态 -->
      <div v-if="config.enabled === false" class="text-sm text-gray-400 italic">
        {{ config.placeholder || '该功能暂未开放' }}
      </div>

      <!-- 单选框类型 -->
      <SettingRadio
        v-else-if="config.type === SETTING_TYPES.RADIO"
        :value="currentValue"
        :options="config.options"
        @update:value="handleValueChange"
      />

      <!-- 开关类型 -->
      <SettingSwitch
        v-else-if="config.type === SETTING_TYPES.SWITCH"
        :value="currentValue"
        @update:value="handleValueChange"
      />

      <!-- 下拉选择类型 -->
      <SettingSelect
        v-else-if="config.type === SETTING_TYPES.SELECT"
        :value="currentValue"
        :options="config.options"
        @update:value="handleValueChange"
      />

      <!-- 自定义组件类型 -->
      <component
        v-else-if="config.type === SETTING_TYPES.CUSTOM && customComponent"
        :is="customComponent"
        v-bind="config.props"
      />

      <!-- 未知类型 -->
      <div v-else class="text-sm text-red-500">
        未知的设置项类型: {{ config.type }}
      </div>
    </div>
  </div>
</template>
