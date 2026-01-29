# 无障碍访问规范（ARIA）

简明的无障碍访问实践指南。

## 基本原则

1. **语义化 HTML 优先** - 使用 `<button>` 而非 `<div role="button">`
2. **图标按钮必须有标签** - 使用 `aria-label`
3. **键盘可访问** - 所有交互都能用键盘操作

## 常用场景

### 图标按钮

```vue
<!-- ✅ 有 aria-label -->
<button aria-label="关闭">
  <IconClose />
</button>

<!-- ❌ 缺少标签 -->
<button>
  <IconClose />
</button>
```

### 装饰性元素

```vue
<!-- 装饰性图标 -->
<button>
  <IconSave aria-hidden="true" />
  保存
</button>
```

### 对话框

```vue
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-modal="true"
>
  <h2 id="dialog-title">标题</h2>
  <button aria-label="关闭" @click="close">
    <IconClose />
  </button>
</div>
```

### 展开/折叠

```vue
<button :aria-expanded="isOpen">
  更多选项
</button>
```

### 表单标签

```vue
<!-- ✅ 使用 label -->
<label for="name">姓名</label>
<input id="name" type="text" />

<!-- ✅ 使用 aria-label -->
<input type="text" aria-label="搜索" />

<!-- ❌ 只有 placeholder -->
<input type="text" placeholder="搜索" />
```

### 错误提示

```vue
<input
  :aria-invalid="hasError"
  :aria-describedby="hasError ? 'error' : null"
/>
<span v-if="hasError" id="error" role="alert">
  错误信息
</span>
```

### 键盘支持

```vue
<script setup>
const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    自定义按钮
  </div>
</template>
```

## 快速检查清单

- [ ] 图标按钮有 `aria-label`
- [ ] 表单输入有 `label` 或 `aria-label`
- [ ] 对话框有 `role="dialog"` 和 `aria-labelledby`
- [ ] 装饰性元素有 `aria-hidden="true"`
- [ ] 自定义交互元素有 `role` 和 `tabindex="0"`
- [ ] 所有功能可用键盘操作（Tab、Enter、Esc）

