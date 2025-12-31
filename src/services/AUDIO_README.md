# Audio 服务职责划分

## 目录结构

```
src/
├── services/
│   ├── audio/                    # ✅ 音频核心服务（纯逻辑）
│   │   ├── index.js             # AudioService 主入口
│   │   ├── audioCore.js         # 核心播放逻辑
│   │   ├── audioControls.js     # 播放控制
│   │   ├── audioCache.js        # 缓存管理
│   │   ├── audioSession.js      # 会话管理
│   │   └── audioUtils.js        # 工具函数
│   ├── audioService.js          # 📖 参考实现（保留）
│   └── audioWorkService.js      # 📖 参考实现（保留）
│
└── components/player/           # ✅ 播放器 UI 组件
    ├── Player/
    │   └── PlayerView.vue       # 播放器视图（使用 AudioService）
    └── PlayButton/
        └── PlayButton.vue       # 播放按钮

## 职责划分

### services/audio/ - 音频核心服务
**职责：** 纯音频业务逻辑，不涉及 UI
- 音频播放、暂停、停止
- 音量控制、倍速控制
- 音频缓存管理
- 播放会话管理
- 播放状态管理

**特点：**
- ✅ 框架无关（可在任何 JS 环境使用）
- ✅ 可测试性强
- ✅ 职责单一

### components/player/ - 播放器 UI 组件
**职责：** 播放器用户界面
- 播放器 UI 渲染
- 用户交互处理
- 播放状态显示
- 进度条交互

**依赖关系：**
```javascript
// PlayerView.vue 调用 AudioService
import AudioService from "@/services/audio/index.js";

const audioService = new AudioService();
await audioService.load(url);
audioService.play();
```

## 迁移计划（后续）

当前 PlayerView.vue 直接使用 HTML `<audio>` 元素，后续可以迁移到使用 AudioService API：

**当前方式：**
```vue
<audio ref="audio" :src="audioSrc"></audio>
<script>
audio.value.play()
</script>
```

**目标方式：**
```javascript
const audioService = new AudioService()
await audioService.load(audioUrl)
audioService.play()
```

## 参考文件说明

- `audioService.js` - 原始音频服务实现参考
- `audioWorkService.js` - Worker Service 实现参考

这些文件保留用于：
1. 参考之前的实现思路
2. 对比新旧实现差异
3. 迁移时的功能对照
