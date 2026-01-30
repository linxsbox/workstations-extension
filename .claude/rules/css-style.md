# 样式和 UI 组件规范

适用于 workstations-extension 项目的样式编写和 UI 组件使用。

## Tailwind CSS 使用原则

### 基本原则

```vue
<!-- ✅ 正确：语义 class + Tailwind -->
<div class="header-bar flex items-center gap-4 p-4 bg-white rounded-md">
  <button class="menu-button px-3 py-2 text-sm font-medium">菜单</button>
</div>

<!-- ❌ 错误：过多自定义 class -->
<div class="container wrapper box content panel">
  <button class="button primary large">菜单</button>
</div>
```

**使用原则**：
- 元素上**仅保留语义化 class**（如 `header-bar`, `menu-button`）
- 其余样式**直接使用 Tailwind 工具类**
- 复杂样式、伪类、过渡效果使用 SCSS

### 常用 Tailwind 类

```vue
<!-- 布局 -->
<div class="flex flex-col items-center justify-between gap-4">
<div class="grid grid-cols-3 gap-2">

<!-- 间距 -->
<div class="p-4 px-6 py-2 m-4 mx-auto">

<!-- 尺寸 -->
<div class="w-full h-screen max-w-md min-h-0">

<!-- 文字 -->
<p class="text-sm text-base text-lg font-medium font-bold">

<!-- 颜色（使用 CSS 变量） -->
<div class="text-[var(--text-primary)] bg-[var(--bg-secondary)]">
```

## CSS 变量使用

### 项目 CSS 变量

```scss
// 文字颜色
var(--text-primary)      // 主要文字
var(--text-secondary)    // 次要文字
var(--text-tertiary)     // 三级文字

// 背景色
var(--bg-primary)        // 主背景
var(--bg-secondary)      // 次背景
var(--bg-tertiary)       // 三级背景

// 主题色
var(--color-primary)     // 主色
var(--color-success)     // 成功色
var(--color-warning)     // 警告色
var(--color-error)       // 错误色
var(--color-info)        // 信息色

// 边框
var(--border-color)      // 边框颜色

// 交互状态
var(--interactive-default)  // 默认状态
var(--interactive-hover)    // 悬停状态
var(--interactive-active)   // 激活状态
```

### 使用示例

```scss
.custom-button {
  color: var(--text-primary);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);

  &:hover {
    color: var(--interactive-hover);
    background-color: var(--bg-secondary);
  }

  &:active {
    color: var(--interactive-active);
  }
}
```

## Tailwind + SCSS 结合

### 何时使用 SCSS

使用 SCSS 处理：
- 伪类（:hover, :active, :focus）
- 伪元素（::before, ::after）
- 复杂的嵌套结构
- 过渡和动画
- 需要计算的样式

```vue
<template>
  <button class="custom-button flex items-center gap-2 px-4 py-2">
    <span class="button-text">Click me</span>
  </button>
</template>

<style lang="scss" scoped>
.custom-button {
  // 基础样式使用 Tailwind
  // 复杂状态使用 SCSS
  color: var(--text-primary);
  background-color: var(--bg-primary);
  transition: all 0.2s ease;

  &:hover {
    color: var(--interactive-hover);
    background-color: var(--bg-secondary);
    transform: translateY(-2px);
  }

  &:active {
    color: var(--interactive-active);
    transform: translateY(0);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-text {
    &::before {
      content: '→ ';
    }
  }
}
</style>
```

## Naive UI 组件使用

### 组件导入

```vue
<script setup>
// 按需导入组件
import { NButton, NInput, NModal, NCard, NEmpty } from 'naive-ui'

// 导入 hooks
import { useMessage, useDialog } from 'naive-ui'

const message = useMessage()
const dialog = useDialog()
</script>
```

### 组件命名

```vue
<!-- ✅ 使用 PascalCase（大驼峰） -->
<NButton type="primary">确定</NButton>
<NInput v-model:value="text" placeholder="请输入" />
<NModal v-model:show="visible">...</NModal>
<NCard title="标题">...</NCard>

<!-- ❌ 不要使用 kebab-case -->
<n-button type="primary">确定</n-button>
```

### 常用组件

```vue
<!-- 按钮 -->
<NButton type="primary">主要按钮</NButton>
<NButton type="error">错误按钮</NButton>
<NButton secondary>次要按钮</NButton>
<NButton text>文本按钮</NButton>

<!-- 输入框 -->
<NInput v-model:value="text" placeholder="请输入" />
<NInput type="textarea" v-model:value="content" />

<!-- 模态框 -->
<NModal v-model:show="visible" preset="card" title="标题">
  内容
</NModal>

<!-- 卡片 -->
<NCard title="标题">
  <template #header>自定义头部</template>
  内容
</NCard>

<!-- 空状态 -->
<NEmpty description="暂无数据" />
```

## 图标组件

项目使用自维护图标，不依赖 Naive UI 图标包。

```vue
<script setup>
import IconSettings from '@/components/common/Icons/IconSettings.vue'
import IconClose from '@/components/common/Icons/IconClose.vue'
import IconAddTask from '@/components/common/Icons/IconAddTask.vue'
</script>

<template>
  <!-- 使用 Tailwind 控制图标大小和颜色 -->
  <IconSettings class="w-5 h-5 text-[var(--text-primary)]" />
  <IconClose class="w-4 h-4 text-[var(--color-error)]" />

  <!-- 也可以使用自定义 class -->
  <IconAddTask class="icon-add text-lg" />
</template>

<style lang="scss" scoped>
.icon-add {
  color: var(--color-success);

  &:hover {
    color: var(--interactive-hover);
  }
}
</style>
```

## 响应式设计

### 断点使用

```vue
<template>
  <!-- Tailwind 响应式类 -->
  <div class="flex flex-col md:flex-row gap-4">
    <div class="w-full md:w-1/2 lg:w-1/3">
      内容
    </div>
  </div>
</template>
```

## 动画和过渡

### CSS 过渡

```scss
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
```

### CSS 动画

```scss
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading {
  animation: spin 1s linear infinite;
}
```

## 最佳实践

### 避免内联样式

```vue
<!-- ❌ 避免内联样式 -->
<div style="color: red; padding: 10px;">内容</div>

<!-- ✅ 使用 Tailwind 或 class -->
<div class="text-red-500 p-2.5">内容</div>
<div class="custom-box">内容</div>
```

### 使用 scoped 样式

```vue
<style lang="scss" scoped>
/* scoped 样式只影响当前组件 */
.button {
  color: blue;
}
</style>
```

### 深度选择器

```vue
<style lang="scss" scoped>
/* 需要修改子组件样式时使用 :deep() */
.wrapper {
  :deep(.n-card) {
    border-radius: 8px;
  }

  :deep(.n-button__content) {
    font-weight: 500;
  }
}
</style>
```
