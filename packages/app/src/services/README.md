# Services 层架构

Services 层提供应用的业务逻辑服务，独立于 UI 组件和状态管理。

## 目录结构

```
src/services/
├── audio/                 # 音频服务
│   ├── index.js          # AudioService 主入口
│   ├── audioCore.js      # 核心播放逻辑
│   ├── audioControls.js  # 播放控制
│   ├── audioCache.js     # 缓存管理
│   ├── audioSession.js   # 会话管理
│   └── audioUtils.js     # 工具函数
│
├── rss/                  # RSS 服务
│   ├── index.js          # RSS Service 入口
│   └── processor.js      # RSS 处理器（从 stores 移动过来）
│
├── api/                  # API 请求服务
│   └── index.js          # API 客户端基类
│
├── storage/              # 存储服务
│   └── index.js          # LocalStorage & ChromeStorage 封装
│
├── audioService.js       # 📖 参考实现（保留）
├── audioWorkService.js   # 📖 参考实现（保留）
└── AUDIO_README.md       # Audio 服务职责说明
```

## 设计原则

### 1. 职责分离
- **Services**: 业务逻辑处理
- **Stores**: 状态管理
- **Components**: UI 渲染

### 2. 框架无关
Services 应尽可能独立于 Vue/Pinia，便于：
- 单元测试
- 跨项目复用
- 技术栈迁移

### 3. 单一职责
每个 Service 模块只负责一个领域：
- `audio/` - 音频播放
- `rss/` - RSS 处理
- `api/` - HTTP 请求
- `storage/` - 数据存储

## 使用示例

### Audio Service
```javascript
import AudioService from "@/services/audio/index.js";

const audio = new AudioService();
await audio.load("https://example.com/audio.mp3");
audio.play();
```

### RSS Service
```javascript
import { RssProcessorFactory } from "@/services/rss/index.js";

const processor = RssProcessorFactory.create(rssSource);
await processor.validate();
const info = await processor.fetchSourceInfo();
```

### Storage Service
```javascript
import { LocalStorageService, ChromeStorageService } from "@/services/storage/index.js";

// 本地存储
LocalStorageService.set("key", value);
const data = LocalStorageService.get("key");

// Chrome 同步存储
await ChromeStorageService.set("settings", config);
const settings = await ChromeStorageService.get("settings");
```

### API Service
```javascript
import { ApiClient } from "@/services/api/index.js";

const api = new ApiClient("https://api.example.com");
const data = await api.get("/endpoint");
```

## 后续扩展计划

### API 服务扩展
- `api/podcast.js` - 播客 API（小宇宙、GetPodcast）
- `api/rss.js` - RSS 获取 API
- `api/llm.js` - LLM API（DeepSeek 等）

### RSS 服务扩展
- `rss/parser.js` - RSS 解析器
- `rss/fetcher.js` - RSS 获取器

### Storage 服务扩展
- `storage/indexedDB.js` - IndexedDB 封装
- `storage/cache.js` - 缓存策略管理

## 迁移指南

### 从 Stores 移动业务逻辑到 Services

**Before:**
```javascript
// stores/storeRss/index.js
actions: {
  async fetchRss(url) {
    const response = await fetch(url);
    // 业务逻辑处理...
  }
}
```

**After:**
```javascript
// services/rss/fetcher.js
export class RssFetcher {
  async fetch(url) {
    const response = await fetch(url);
    // 业务逻辑处理...
  }
}

// stores/modules/rss/index.js
import { RssFetcher } from "@/services/rss/fetcher";
actions: {
  async fetchRss(url) {
    const fetcher = new RssFetcher();
    return fetcher.fetch(url);
  }
}
```

## 最佳实践

1. **单向依赖**：Services 不应依赖 Stores 或 Components
2. **异步优先**：使用 async/await 处理异步操作
3. **错误处理**：Service 层应抛出明确的错误，由调用方处理
4. **类型安全**：使用 JSDoc 或 TypeScript 标注类型
5. **可测试性**：设计时考虑单元测试的便利性
