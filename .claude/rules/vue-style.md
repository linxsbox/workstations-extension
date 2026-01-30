# Vue 组件编写规范

适用于 workstations-extension 项目的 Vue 3 组件开发。

## 组件内部结构顺序

组件内部**必须**按以下顺序组织：

```vue
<script setup>
// 1. Vue API 导入
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

// 2. 第三方库导入（按字母序）
import { NButton, NInput } from 'naive-ui'
import { isArray, defaultStorage } from '@linxs/toolkit'

// 3. 本地组件导入
import HeaderBar from '@/components/common/HeaderBar/HeaderBarView.vue'

// 4. Stores 导入
import { storeSettings } from '@/stores/modules/settings'

// 5. 配置/常量/工具导入
import { SETTING_TYPES } from '@/stores/modules/settings/types'
import { formatDate } from '@/utils/format'

// 6. Props 定义
const props = defineProps({ ... })

// 7. Emits 定义
const emit = defineEmits([...])

// 8. Store 实例化
const store = storeSettings()
const { setting } = storeToRefs(store)

// 9. 响应式状态
const isVisible = ref(false)
const count = computed(() => store.count)

// 10. 方法定义
const handleClick = () => { ... }

// 11. 生命周期钩子
onMounted(() => { ... })
</script>

<template>
  <!-- 模板内容 -->
</template>

<style lang="scss" scoped>
/* 样式内容 */
</style>
```

## Props 定义规范

```js
const props = defineProps({
  // 基础类型：必须指定 type 和 default
  title: {
    type: String,
    default: ''
  },

  // 复杂类型：使用工厂函数作为 default
  options: {
    type: Array,
    default: () => []
  },

  // 必需参数：使用 required
  config: {
    type: Object,
    required: true
  },

  // 多类型：使用数组
  value: {
    type: [String, Number],
    default: null
  }
})
```

## 模板属性顺序

```vue
<component
  v-if="condition"
  v-for="item in items"
  :key="item.id"
  ref="elementRef"
  :prop1="value1"
  :prop2="value2"
  @event1="handler1"
  @event2="handler2"
  class="custom-class"
>
```

**顺序说明**：
1. 指令（v-if, v-for）
2. 特殊属性（key, ref）
3. Props（:prop）
4. 事件（@event）
5. class/style

## 组件命名规范

### 文件命名

- **视图组件**: `*View.vue`
  - `HeaderBarView.vue`, `RssPanelView.vue`

- **功能组件**: PascalCase
  - `SearchBox.vue`, `PlayButton.vue`, `TaskCard.vue`

- **对话框组件**: `*Dialog.vue`
  - `SettingDialog.vue`, `RssManagementDialog.vue`

### 组件导入

```js
// ✅ 使用 PascalCase
import UserCard from './UserCard.vue'
import HeaderBar from '@/components/common/HeaderBar/HeaderBarView.vue'

// ❌ 不要使用 kebab-case
import userCard from './user-card.vue'
```

## 模板编写规范

### 条件渲染

```vue
<!-- ✅ 使用 computed 处理复杂逻辑 -->
<script setup>
const hasActiveItems = computed(() => items.value.some(i => i.active))
</script>

<template>
  <div v-if="hasActiveItems">有活跃项</div>
</template>

<!-- ❌ 不要在模板中使用复杂表达式 -->
<template>
  <div v-if="items.filter(i => i.active).length > 0">有活跃项</div>
</template>
```

### 列表渲染

```vue
<!-- ✅ 始终提供 key -->
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>

<!-- ❌ 不要使用 index 作为 key（除非列表是静态的） -->
<div v-for="(item, index) in items" :key="index">
  {{ item.name }}
</div>
```

## 事件处理

### 事件命名

使用 `handle` + 动作：

```js
const handleClick = () => {}
const handleSubmit = () => {}
const handleInputChange = (value) => {}
```

### Emit 定义

```js
// ✅ 使用 kebab-case 命名事件
const emit = defineEmits(['update:value', 'item-click', 'close'])

// 使用
emit('update:value', newValue)
emit('item-click', item)
emit('close')
```

## 避免的反模式

### ❌ 不要做

```js
// 1. 不要直接修改 props
props.value = newValue  // ❌

// 2. 不要在模板中使用复杂逻辑
<div v-if="items.filter(i => i.active).length > 0">  // ❌

// 3. 不要忘记导入 Vue API
const count = ref(0)  // ❌ 缺少 import { ref } from 'vue'

// 4. 不要在 setup 外使用 this
this.someMethod()  // ❌ setup 中没有 this
```

### ✅ 应该做

```js
// 1. 使用 emit 更新父组件
emit('update:value', newValue)  // ✅

// 2. 使用 computed 处理复杂逻辑
const activeItems = computed(() => items.value.filter(i => i.active))
<div v-if="activeItems.length > 0">  // ✅

// 3. 始终导入需要的 API
import { ref } from 'vue'  // ✅
const count = ref(0)

// 4. 直接调用函数
someMethod()  // ✅
```
