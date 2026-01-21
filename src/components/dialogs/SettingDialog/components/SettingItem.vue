<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { SETTING_TYPES } from '@/stores/modules/settings/types'
import { storeSettings } from '@/stores/modules/settings'
import SettingRadio from './SettingRadio.vue'
import SettingSwitch from './SettingSwitch.vue'
import SettingSelect from './SettingSelect.vue'

// 预先导入所有自定义组件
const customComponents = {
  'ShortcutsTable': defineAsyncComponent(() =>
    import('./Children/ShortcutsTable.vue')
  ),
  'APIKeyForm': defineAsyncComponent(() =>
    import('./Children/APIKeyForm.vue')
  ),
  'ConfigManagement': defineAsyncComponent(() =>
    import('./Children/ConfigManagement.vue')
  ),
}

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

// 根据组件路径获取对应的组件
const customComponent = computed(() => {
  if (props.config.type === SETTING_TYPES.CUSTOM && props.config.component) {
    // 从路径中提取组件名称
    const componentName = props.config.component.split('/').pop().replace('.vue', '')
    return customComponents[componentName] || null
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
