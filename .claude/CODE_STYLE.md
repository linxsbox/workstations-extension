# 代码风格规范

本文档定义 workstations-extension 项目的代码编写风格和格式要求。

## Vue 组件编写规范

### 组件内部结构顺序

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

### Props 定义规范

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

### 模板属性顺序

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

## 命名规范

### 文件命名

- **组件文件**: PascalCase
  - 视图组件: `HeaderBarView.vue`, `RssPanelView.vue`
  - 功能组件: `SearchBox.vue`, `PlayButton.vue`
  - 对话框组件: `SettingDialog.vue`, `RssManagementDialog.vue`

- **JS/TS 文件**: camelCase
  - `index.js`, `config.js`, `types.js`

- **工具函数文件**: camelCase
  - `time.js`, `github.js`, `markdown.js`

### 变量命名

```js
// 常量: SCREAMING_SNAKE_CASE
const STORAGE_KEY = 'USER_SETTINGS'
const MAX_RETRY_COUNT = 3

// 变量: camelCase
const userName = 'John'
const isVisible = ref(false)

// 函数: camelCase，动词开头
const handleClick = () => {}
const fetchUserData = async () => {}

// 组件: PascalCase
import UserCard from './UserCard.vue'

// Store: store + PascalCase
export const storeSettings = defineStore({ ... })

// 枚举: PascalCase + Enum 后缀
export const SettingSectionEnum = {
  GENERAL: 'general',
  NOTIFICATION: 'notification'
}
```

### 布尔值命名

使用 `is`, `has`, `should` 前缀：

```js
const isVisible = ref(false)
const hasPermission = computed(() => ...)
const shouldUpdate = true
```

### 事件处理函数命名

使用 `handle` + 动作：

```js
const handleClick = () => {}
const handleSubmit = () => {}
const handleInputChange = (value) => {}
```

## 导入路径规范

```js
// ✅ 使用 @ 别名引用 src 目录
import { storeSettings } from '@/stores/modules/settings'
import IconClose from '@/components/common/Icons/IconClose.vue'

// ✅ 同级或子目录使用相对路径
import SettingItem from './SettingItem.vue'
import RadioOption from './components/RadioOption.vue'

// ❌ 不要使用过深的相对路径
import Component from '../../../components/Component.vue'  // ❌
```

## Pinia Store 编写规范

### Store 结构

```js
export const storeExample = defineStore({
  id: 'StoreExample',  // PascalCase + Store 前缀

  state: () => ({
    // 状态定义，附带注释说明
    isVisible: false,  // 对话框显示状态
    count: 0,          // 计数器
  }),

  getters: {
    // Getter: get/is/has 前缀
    getCount: (state) => state.count,
    isDarkMode: (state) => state.theme === 'dark',
    hasItems: (state) => state.items.length > 0,
  },

  actions: {
    // Action: 动词开头
    increment() { ... },
    setVisible(value) { ... },
    async fetchData() { ... }
  }
})
```

### Action 命名约定

```js
actions: {
  // 设置值: set + 名称
  setTheme(theme) { ... },

  // 切换状态: toggle/switch + 名称
  toggleSidebar() { ... },
  switchTab(tabId) { ... },

  // 打开/关闭: open/close + 名称
  openDialog() { ... },
  closeDialog() { ... },

  // 添加/删除: add/remove + 名称
  addItem(item) { ... },
  removeItem(id) { ... },
}
```

## 样式编写规范

### Tailwind CSS 使用原则

```vue
<!-- ✅ 正确：语义 class + Tailwind -->
<div class="header-bar flex items-center gap-4 p-4 bg-white rounded-md">

<!-- ❌ 错误：过多自定义 class -->
<div class="container wrapper box content panel">
```

**原则**：
- 元素上**仅保留语义化 class**（如 `header-bar`, `menu-button`）
- 其余样式**直接使用 Tailwind 工具类**
- 复杂样式、伪类、过渡效果使用 SCSS

### CSS 变量使用

```scss
// 使用项目定义的 CSS 变量
.custom-button {
  color: var(--text-primary);
  background-color: var(--bg-base);

  &:hover {
    color: var(--interactive-hover);
    background-color: var(--interactive-bg-hover);
  }
}
```

### Tailwind + SCSS 结合

```vue
<template>
  <button class="custom-button flex items-center gap-2 px-4 py-2">
    Click me
  </button>
</template>

<style lang="scss" scoped>
.custom-button {
  // 使用 SCSS 处理复杂状态
  color: var(--interactive-default);
  transition: all 0.2s ease;

  &:hover {
    color: var(--interactive-hover);
  }

  &.active {
    color: var(--interactive-active);
  }
}
</style>
```

## UI 组件使用规范

### Naive UI

```vue
<!-- ✅ 组件名使用大驼峰 -->
<NButton type="primary">确定</NButton>
<NInput v-model:value="text" placeholder="请输入" />
<NModal v-model:show="visible">...</NModal>

<!-- 按需导入 -->
<script setup>
import { NButton, NInput, NModal, useMessage } from 'naive-ui'
</script>
```

### 图标组件

```vue
<!-- 项目使用自维护图标，不依赖 Naive UI 图标包 -->
<script setup>
import IconSettings from '@/components/common/Icons/IconSettings.vue'
import IconClose from '@/components/common/Icons/IconClose.vue'
</script>

<template>
  <IconSettings class="w-5 h-5 text-gray-600" />
</template>
```

## 注释规范

### 何时添加注释

```js
// ✅ 关键逻辑必须注释
// 监听系统主题变化
if (window.matchMedia) {
  const darkModeMediaQuery = getMediaPrefersScheme()
  // ...
}

// ✅ 复杂算法/业务逻辑
// 计算播放时长状态
const calcPlayTime = (width = 0) => {
  // 获取触发变更后的百分比
  const percent = parseInt(`${(width / playerProgress.value.offsetWidth) * 100}`) / 100
  // ...
}

// ✅ TODO 标记待实现功能
// TODO: 实现语言切换逻辑
setLanguage(language) {
  this.language = language
}
```

### 注释风格

```js
// ✅ 单行注释：// 后面加空格
// 这是一个注释

// ❌ 不要紧贴
//这是一个注释

// ✅ 多行注释使用 JSDoc 格式（可选）
/**
 * 计算两个时间的差值
 * @param {Date} start - 开始时间
 * @param {Date} end - 结束时间
 * @returns {number} 时间差（毫秒）
 */
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

// 4. 不要使用魔法数字
setTimeout(() => {}, 300)  // ❌
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

// 4. 使用有意义的常量
const ANIMATION_DURATION = 300
setTimeout(() => {}, ANIMATION_DURATION)  // ✅
```

---

**相关文档**:
- [项目约定](./CONVENTIONS.md) - 团队协作和工作流程
- [架构指南](./ARCHITECTURE.md) - 系统设计和技术选型
