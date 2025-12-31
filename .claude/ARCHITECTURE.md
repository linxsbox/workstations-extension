# 架构指南

本文档描述 workstations-extension 项目的整体架构设计、技术选型和设计模式。

## 项目概览

**workstations-extension** 是一个基于 Chrome Extension 的浏览器工作台扩展，集成了 RSS 订阅、播客管理、AI 聊天、音乐播放器和股票计算器等功能。

### 技术栈选型

| 技术 | 选择 | 原因 |
|------|------|------|
| **框架** | Vue 3 Composition API | 现代化、性能好、生态完善 |
| **构建** | Vite | 快速 HMR、优秀的开发体验 |
| **状态管理** | Pinia | Vue 3 官方推荐、TypeScript 友好 |
| **UI 库** | Naive UI | Vue 3 原生、组件丰富、可定制 |
| **样式** | Tailwind CSS + SCSS | 快速开发 + 复杂样式支持 |
| **工具库** | @linxs/toolkit | 轻量级工具函数集合 |

## 架构分层

### 1. 分层设计

```
┌─────────────────────────────────────┐
│         Views (视图层)              │
│  页面级组件，组合多个 Component      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Components (组件层)            │
│  可复用的 UI 组件                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Stores (状态层)              │
│  Pinia stores，管理应用状态         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Services (服务层)             │
│  业务逻辑、API 调用、数据处理       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Utils (工具层)               │
│  纯函数工具、辅助函数               │
└─────────────────────────────────────┘
```

### 2. 各层职责

#### Views 层
- **职责**: 页面布局、组件组合
- **位置**: `src/views/`
- **特点**:
  - 不包含业务逻辑
  - 调用 Stores 获取数据
  - 组合多个 Components

**示例**：
```vue
<!-- src/views/RssPanel/RssPanelView.vue -->
<script setup>
import { storeRss } from '@/stores/modules/rss'
import TabBarView from '@/components/common/TabBar/TabBarView.vue'
import RssListView from './RssListView.vue'

const store = storeRss()
const { getCurrentList } = storeToRefs(store)

const handleSwitchTab = (tabId) => {
  store.switchSourceData(tabId)
}
</script>
```

#### Components 层
- **职责**: 可复用 UI 组件
- **位置**: `src/components/`
- **分类**:
  - `common/` - 通用组件（HeaderBar、TabBar、Icons）
  - `dialogs/` - 对话框组件
  - `player/` - 播放器相关
  - `widgets/` - 小部件

**示例**：
```vue
<!-- src/components/common/TabBar/TabBarView.vue -->
<script setup>
const props = defineProps({
  panelKey: { type: String, required: true }
})

const emit = defineEmits(['change'])
</script>
```

#### Stores 层
- **职责**: 状态管理、数据持久化
- **位置**: `src/stores/modules/`
- **结构**:
  ```
  stores/modules/settings/
  ├── index.js    # Store 定义
  ├── config.js   # 配置 Schema
  └── types.js    # 类型枚举
  ```

**示例**：
```js
// src/stores/modules/settings/index.js
export const storeSettings = defineStore({
  id: 'StoreSettings',

  state: () => ({
    themeMode: 'system',
    showSettingDialog: false
  }),

  getters: {
    isDarkMode() { ... }
  },

  actions: {
    setThemeMode(mode) { ... },
    openSetting() { ... }
  }
})
```

#### Services 层
- **职责**: 业务逻辑、数据处理、API 调用
- **位置**: `src/services/`
- **模块**:
  - `api/` - API 客户端
  - `rss/` - RSS 解析和处理
  - `audio/` - 音频服务
  - `storage/` - 存储服务

**示例**：
```js
// src/services/rss/processor.js
export class RssProcessorFactory {
  static createProcessor(sourceType) {
    switch (sourceType) {
      case RssSourceTypeEnum.RSS:
        return new StandardRssProcessor()
      case RssSourceTypeEnum.XIAOYUZHOU:
        return new XiaoyuzhouProcessor()
      default:
        throw new Error(`Unknown source type: ${sourceType}`)
    }
  }
}
```

#### Utils 层
- **职责**: 纯函数工具
- **位置**: `src/utils/`
- **原则**:
  - 无副作用
  - 可测试
  - 通用性

**示例**：
```js
// src/utils/time.js
export function timeBefore(currentTime, targetTime) {
  const diff = current - target
  // ... 计算时间差
  return `${hours}小时前`
}
```

## 核心设计模式

### 1. 配置驱动模式 (Config-Driven)

**应用场景**: 设置系统、RSS 源类型

**原理**: 通过配置 Schema 自动生成 UI，而非硬编码组件

**示例**：

```js
// 1. 定义 Schema
export const settingSchema = [
  {
    id: 'general',
    label: '常规设置',
    sections: [
      {
        id: 'theme',
        title: '主题模式',
        type: SETTING_TYPES.RADIO,
        storeKey: 'themeMode',
        action: 'setThemeMode',
        options: [
          { label: '跟随系统', value: 'system' },
          { label: '明亮', value: 'light' },
          { label: '深色', value: 'dark' }
        ]
      }
    ]
  }
]

// 2. 通用渲染组件
<SettingItem :config="item" />

// 3. SettingItem 内部根据 config.type 动态渲染
<SettingRadio v-if="config.type === SETTING_TYPES.RADIO" ... />
<SettingSwitch v-else-if="config.type === SETTING_TYPES.SWITCH" ... />
```

**优势**：
- ✅ 易于扩展（只需添加配置）
- ✅ 减少重复代码
- ✅ 配置集中管理
- ✅ UI 自动适配

### 2. 工厂模式 (Factory Pattern)

**应用场景**: RSS 处理器

**原理**: 根据类型动态创建不同的处理器实例

```js
export class RssProcessorFactory {
  static createProcessor(sourceType) {
    switch (sourceType) {
      case RssSourceTypeEnum.RSS:
        return new StandardRssProcessor()
      case RssSourceTypeEnum.XIAOYUZHOU:
        return new XiaoyuzhouProcessor()
      case RssSourceTypeEnum.KR36:
        return new Kr36Processor()
      default:
        throw new Error(`Unknown source type: ${sourceType}`)
    }
  }
}

// 使用
const processor = RssProcessorFactory.createProcessor(source.type)
const data = await processor.process(rawData)
```

### 3. 观察者模式 (Observer Pattern)

**应用场景**: Store 数据变化监听

**实现**: Pinia 内置，通过 `storeToRefs` 实现响应式

```js
const store = storeSettings()
const { themeMode } = storeToRefs(store)

watch(themeMode, (newMode) => {
  // 主题变化时自动更新 UI
  updateThemeMode(newMode)
})
```

## 数据流

### 单向数据流

```
User Action
    ↓
Component Event
    ↓
Store Action
    ↓
Service/API Call
    ↓
Store State Update
    ↓
Component Re-render
```

**示例流程**：

```
用户点击"切换主题"
    ↓
<SettingRadio @update:value="handleValueChange">
    ↓
handleValueChange() → store.setThemeMode(value)
    ↓
setThemeMode() {
  this.themeMode = value
  localStorage.set('theme', value)
  updateThemeMode(value)
}
    ↓
themeMode 变化 → UI 自动更新
```

### Store 间通信

```js
// ❌ 不要：Store 间直接调用
// storeRss.js
import { storeTab } from '../tab'
storeTab().addTab(...)  // 不推荐

// ✅ 应该：通过事件总线或组件协调
// Component.vue
const rssStore = storeRss()
const tabStore = storeTab()

watch(() => rssStore.currentSource, (source) => {
  tabStore.addTab(source.id, source.title)
})
```

## Chrome Extension 架构

### Manifest V3 结构

```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "tabs",
    "contextMenus"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}
```

### 通信架构

```
┌─────────────┐
│   Popup     │ ← 主界面（Vue App）
└──────┬──────┘
       │ chrome.runtime.sendMessage
       ↓
┌─────────────┐
│  Background │ ← Service Worker
│   Service   │
└──────┬──────┘
       │ chrome.tabs.sendMessage
       ↓
┌─────────────┐
│   Content   │ ← 注入到网页的脚本
│   Script    │
└─────────────┘
```

### 存储策略

```js
// 1. Chrome Storage (chrome.storage.local)
// - 优点：同步到 Google 账户
// - 限制：100KB
// - 用途：用户设置、重要配置

// 2. LocalStorage
// - 优点：容量大（5MB+）
// - 限制：仅本地
// - 用途：RSS 源数据、缓存

// 3. IndexedDB（未使用）
// - 优点：大容量、结构化
// - 用途：离线数据、大量数据存储
```

## 性能优化策略

### 1. 组件懒加载

```js
// 路由级懒加载
const routes = [
  {
    path: '/settings',
    component: () => import('./views/SettingDialog.vue')
  }
]

// 对话框懒加载
const SettingDialog = defineAsyncComponent(() =>
  import('./components/dialogs/SettingDialog.vue')
)
```

### 2. 虚拟滚动

```vue
<!-- 长列表使用虚拟滚动 -->
<VirtualList
  :items="rssList"
  :item-height="80"
  :visible-count="20"
>
  <template #default="{ item }">
    <RssCard :data="item" />
  </template>
</VirtualList>
```

### 3. 计算属性缓存

```js
// ✅ 使用 computed 缓存计算结果
const filteredItems = computed(() => {
  return items.value.filter(i => i.active)
})

// ❌ 不要在模板中重复计算
<div v-for="item in items.filter(i => i.active)">
```

## 扩展性设计

### 1. 插件化 RSS 源

新增 RSS 源类型只需：

1. 在 `config.js` 添加配置
2. 创建对应的 Processor
3. 注册到工厂

```js
// 1. 添加配置
export const RssSourceTypeEnum = {
  // ... 现有
  NEW_SOURCE: 'new-source'  // 新增
}

// 2. 创建 Processor
class NewSourceProcessor extends BaseProcessor {
  async process(data) { ... }
}

// 3. 注册
RssProcessorFactory.register(
  RssSourceTypeEnum.NEW_SOURCE,
  NewSourceProcessor
)
```

### 2. 配置化设置项

新增设置项只需修改 Schema：

```js
export const settingSchema = [
  {
    id: 'general',
    sections: [
      // ... 现有设置
      {
        id: 'newSetting',  // 新增
        title: '新设置',
        type: SETTING_TYPES.SWITCH,
        storeKey: 'newValue',
        action: 'setNewValue'
      }
    ]
  }
]
```

### 3. 面板扩展

新增面板只需：

```js
// 1. 在 panelConfig.js 注册
export const panelConfig = {
  // ... 现有面板
  newPanel: {
    id: 'new-panel',
    label: '新面板',
    icon: IconNew,
    component: () => import('@/views/NewPanel/NewPanelView.vue')
  }
}

// 2. 创建组件
// src/views/NewPanel/NewPanelView.vue
```

## 安全考虑

### 1. CSP (Content Security Policy)

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 2. 输入验证

```js
// ✅ 验证 RSS URL
function isValidRssUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

// ✅ 过滤 HTML
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(dirtyHTML)
```

### 3. 权限最小化

只请求必要的权限：

```json
{
  "permissions": [
    "storage"  // ✅ 必需
    // "tabs"  // ❌ 不需要则不请求
  ]
}
```

## 测试策略

### 测试金字塔

```
        ┌───────┐
        │  E2E  │  少量端到端测试
        └───────┘
      ┌───────────┐
      │Integration│  集成测试
      └───────────┘
    ┌───────────────┐
    │  Unit Tests   │  大量单元测试
    └───────────────┘
```

### 测试重点

1. **Utils 层** - 100% 覆盖率
2. **Services 层** - 核心逻辑测试
3. **Stores 层** - Actions 测试
4. **Components 层** - 关键交互测试

## 未来优化方向

### 短期 (1-3 个月)

- [ ] 添加单元测试覆盖
- [ ] 实现虚拟滚动
- [ ] 优化构建体积
- [ ] 添加错误边界处理

### 中期 (3-6 个月)

- [ ] TypeScript 迁移
- [ ] PWA 支持
- [ ] 离线功能
- [ ] 数据同步

### 长期 (6+ 个月)

- [ ] 微前端架构
- [ ] 插件系统
- [ ] 主题市场
- [ ] 云端备份

---

**相关文档**:
- [代码风格](./CODE_STYLE.md) - 代码编写规范
- [项目约定](./CONVENTIONS.md) - 团队协作和工作流程

**最后更新**: 2025-12-31
