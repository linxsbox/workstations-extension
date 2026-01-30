# JavaScript 代码规范

适用于 workstations-extension 项目的 JavaScript/TypeScript 代码。

## 命名规范

### 常量

```js
// SCREAMING_SNAKE_CASE
const STORAGE_KEY = 'USER_SETTINGS'
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'
```

### 变量

```js
// camelCase
const userName = 'John'
const isVisible = ref(false)
const userList = []
```

### 函数

```js
// camelCase，动词开头
const handleClick = () => {}
const fetchUserData = async () => {}
const validateForm = () => {}
const calculateTotal = (items) => {}
```

### 布尔值

使用 `is`, `has`, `should`, `can` 前缀：

```js
const isVisible = ref(false)
const hasPermission = computed(() => user.role === 'admin')
const shouldUpdate = true
const canEdit = false
```

### 枚举

```js
// PascalCase + Enum 后缀
export const SettingSectionEnum = {
  GENERAL: 'general',
  NOTIFICATION: 'notification',
  APPEARANCE: 'appearance'
}

export const TaskStatusEnum = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed'
}
```

## 文件命名

### JavaScript/TypeScript 文件

```
// camelCase
index.js
config.js
types.js
utils.js

// 工具函数文件
time.js
github.js
markdown.js
format.js
```

## 导入路径规范

```js
// ✅ 使用 @ 别名引用 src 目录
import { storeSettings } from '@/stores/modules/settings'
import IconClose from '@/components/common/Icons/IconClose.vue'

// ✅ 同级或子目录使用相对路径
import SettingItem from './SettingItem.vue'
import { formatDate } from './utils/format'

// ❌ 不要使用过深的相对路径
import Component from '../../../components/Component.vue'  // ❌
```

## Pinia Store 规范

### Store 命名

```js
// store + PascalCase
export const storeSettings = defineStore('settings', { ... })
export const storeTasks = defineStore('tasks', { ... })
export const storeApp = defineStore('app', { ... })
```

### Store 结构

```js
export const storeExample = defineStore('example', {
  state: () => ({
    // 状态定义，附带注释说明
    isVisible: false,  // 对话框显示状态
    count: 0,          // 计数器
    items: [],         // 数据列表
  }),

  getters: {
    // Getter: get/is/has 前缀
    getCount: (state) => state.count,
    isDarkMode: (state) => state.theme === 'dark',
    hasItems: (state) => state.items.length > 0,

    // 可以使用其他 getter
    doubleCount() {
      return this.count * 2
    }
  },

  actions: {
    // Action: 动词开头
    increment() {
      this.count++
    },

    setVisible(value) {
      this.isVisible = value
    },

    async fetchData() {
      try {
        const data = await api.getData()
        this.items = data
      } catch (error) {
        // 错误处理
      }
    }
  }
})
```

### Action 命名约定

```js
actions: {
  // 设置值: set + 名称
  setTheme(theme) {
    this.theme = theme
  },

  setUser(user) {
    this.user = user
  },

  // 切换状态: toggle/switch + 名称
  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible
  },

  switchTab(tabId) {
    this.activeTab = tabId
  },

  // 打开/关闭: open/close + 名称
  openDialog() {
    this.dialogVisible = true
  },

  closeDialog() {
    this.dialogVisible = false
  },

  // 添加/删除: add/remove + 名称
  addItem(item) {
    this.items.push(item)
  },

  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id)
  },

  // 更新: update + 名称
  updateItem(id, data) {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...data }
    }
  },

  // 获取数据: fetch + 名称
  async fetchUsers() {
    const users = await api.getUsers()
    this.users = users
  }
}
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
const setLanguage = (language) => {
  this.language = language
}

// ✅ FIXME 标记需要修复的问题
// FIXME: 需要处理边界情况
const processData = (data) => {
  // ...
}
```

### 注释风格

```js
// ✅ 单行注释：// 后面加空格
// 这是一个注释

// ❌ 不要紧贴
//这是一个注释

// ✅ 多行注释使用 JSDoc 格式
/**
 * 计算两个时间的差值
 * @param {Date} start - 开始时间
 * @param {Date} end - 结束时间
 * @returns {number} 时间差（毫秒）
 */
const calculateTimeDiff = (start, end) => {
  return end.getTime() - start.getTime()
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期
 */
```

## 最佳实践

### 使用常量替代魔法数字

```js
// ❌ 不要使用魔法数字
setTimeout(() => {}, 300)
if (status === 1) { }

// ✅ 使用有意义的常量
const ANIMATION_DURATION = 300
const STATUS_ACTIVE = 1

setTimeout(() => {}, ANIMATION_DURATION)
if (status === STATUS_ACTIVE) { }
```

### 错误处理

```js
// ✅ 始终处理错误
try {
  const data = await fetchData()
  return data
} catch (error) {
  console.error('获取数据失败:', error)
  return null
}

// ✅ 使用可选链避免错误
const userName = user?.profile?.name ?? '未知用户'

// ✅ 提供降级方案
const config = loadConfig() || getDefaultConfig()
```

### 异步函数

```js
// ✅ 使用 async/await
const fetchUserData = async () => {
  try {
    const response = await api.getUser()
    return response.data
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

// ❌ 避免回调地狱
api.getUser((user) => {
  api.getPosts(user.id, (posts) => {
    // ...
  })
})
```
