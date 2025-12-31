# 项目约定

本文档定义 workstations-extension 项目的团队协作规范和工作流程。

## Git 工作流程

### 分支策略

```
main           # 主分支，随时可发布
├── feat/*     # 功能开发分支
├── fix/*      # Bug 修复分支
├── refactor/* # 重构分支
└── chore/*    # 杂项分支（依赖更新、配置等）
```

### 分支命名规范

```bash
# 功能分支
feat/search-podcast
feat/dark-mode-toggle

# Bug 修复
fix/audio-playback-issue
fix/rss-parser-error

# 重构
refactor/project-structure
refactor/settings-system

# 杂项
chore/update-dependencies
chore/optimize-build
```

### Commit 提交规范

使用**语义化提交消息**：

```bash
# 格式
<type>: <description>

# 类型
feat:     新功能
fix:      修复 Bug
refactor: 重构（不改变功能）
chore:    杂项（依赖更新、构建配置等）
docs:     文档更新
style:    代码格式（不影响功能）
perf:     性能优化
test:     测试相关
```

**示例**：

```bash
feat: 添加播客搜索功能
fix: 修复音频播放完成后的状态问题
refactor: 重构 Settings 为配置驱动架构
chore: 更新 Naive UI 到 2.x 版本
docs: 更新 README 安装说明
```

### Commit 最佳实践

```bash
# ✅ 好的提交消息
feat: 添加深色模式切换按钮
fix: 修复 RSS 解析时时区错误
refactor: 将 Player 目录重命名为小写

# ❌ 不好的提交消息
update code
fix bug
修改文件
```

**原则**：
- 每个 commit 只做一件事
- 提交消息清晰描述做了什么
- 不提交未完成的功能
- 不提交 console.log/debugger

## Pull Request 流程

### PR 标题格式

与 commit 消息格式相同：

```
feat: 实现配置驱动的设置系统
fix: 修复订阅源导入导出功能
```

### PR 描述模板

```markdown
## 概述
简要描述这个 PR 做了什么

## 变更内容
- [ ] 添加了 XXX 功能
- [ ] 修复了 XXX 问题
- [ ] 重构了 XXX 模块

## 测试
- [ ] 手动测试通过
- [ ] 构建成功
- [ ] 没有引入新的 warnings

## 截图/演示
（如果是 UI 变更，提供截图或 GIF）

## 相关 Issue
Closes #123
```

### Code Review 要点

**Review 时关注**：
1. 是否符合代码风格规范
2. 逻辑是否清晰
3. 是否有安全隐患
4. 性能是否有问题
5. 是否需要添加注释

**禁止行为**：
- 未经 review 直接合并
- 合并有冲突的 PR
- 合并构建失败的 PR

## 文件组织约定

### 目录结构规范

```
src/
├── components/
│   ├── common/          # 通用组件（按功能分组）
│   │   ├── HeaderBar/
│   │   ├── TabBar/
│   │   └── Icons/
│   ├── dialogs/         # 对话框组件
│   │   ├── SettingDialog/
│   │   └── RssManagementDialog/
│   ├── player/          # 播放器相关
│   └── widgets/         # 可复用小部件
├── views/               # 页面/面板组件
│   ├── AsidePanel/
│   ├── MainPanel/
│   └── RssPanel/
├── stores/
│   ├── modules/         # Pinia store 模块
│   │   ├── settings/
│   │   │   ├── index.js    # Store 定义
│   │   │   ├── config.js   # 配置 Schema
│   │   │   └── types.js    # 类型枚举
│   │   └── rss/
│   └── config/          # 全局配置
├── services/            # 业务逻辑层
│   ├── api/
│   ├── rss/
│   └── audio/
└── utils/               # 工具函数
    ├── time.js
    ├── github.js
    └── index.js
```

### 新增组件的位置

**决策树**：

```
新增组件？
├── 是对话框？
│   └── 放在 components/dialogs/
├── 是页面级组件？
│   └── 放在 views/
├── 是通用组件（多处使用）？
│   └── 放在 components/common/
└── 是特定功能组件？
    └── 放在对应的功能目录
```

### 文件命名约定

```
组件文件：     PascalCase + View.vue 后缀（页面组件）
             PascalCase.vue（功能组件）
配置文件：     config.js, types.js
工具文件：     camelCase.js
Store 文件：   index.js（Store 定义）
```

## 开发环境设置

### 必需工具

- **Node.js**: >= 18.x
- **pnpm**: >= 8.x（包管理器）
- **VS Code**（推荐编辑器）

### VS Code 推荐扩展

```json
{
  "recommendations": [
    "vue.volar",              // Vue 3 语言支持
    "bradlc.vscode-tailwindcss", // Tailwind CSS 智能提示
    "csstools.postcss",       // CSS 智能提示
  ]
}
```

### 本地开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建生产版本
pnpm run build

# 代码检查
pnpm run lint

# 格式化代码
pnpm run format
```

## 依赖管理

### 添加依赖规则

```bash
# ✅ 使用 pnpm add（不要用 npm install）
pnpm add package-name

# ✅ 开发依赖使用 -D
pnpm add -D vite-plugin-xxx

# ❌ 不要直接修改 package.json
```

### 依赖更新策略

- **小版本更新**：可以直接更新
- **大版本更新**：需要测试后再提交
- **锁定关键依赖版本**：如 Vue、Vite 等

### 禁止依赖

以下依赖**不允许**添加到项目：
- ~~Moment.js~~ - 太大，使用原生 Date 或 @linxs/toolkit
- ~~Lodash~~ - 按需使用 @linxs/toolkit
- ~~jQuery~~ - 不符合 Vue 3 生态

## 测试约定

### 测试范围

```
# 必须测试
- 核心业务逻辑（Store actions）
- 数据处理函数（utils）
- RSS 解析器

# 可选测试
- UI 组件交互
- 边界情况
```

### 测试文件位置

```
src/
├── utils/
│   ├── time.js
│   └── time.spec.js       # 测试文件与源文件同目录
└── services/
    ├── rss/
    │   ├── processor.js
    │   └── processor.spec.js
```

## 文档约定

### 何时写文档

- **新增功能**：在 PR 中说明使用方式
- **架构变更**：更新 ARCHITECTURE.md
- **约定变更**：更新 CONVENTIONS.md
- **复杂逻辑**：在代码中添加注释

### README 维护

README.md 应包含：
- 项目介绍
- 快速开始
- 功能列表
- 开发指南
- 常见问题

### 变更日志

在 CHANGELOG.md 中记录：
- 新功能
- Bug 修复
- Breaking Changes

## 发布流程

### 版本号规范

遵循 [Semantic Versioning](https://semver.org/)：

```
主版本号.次版本号.修订号

1.2.3
│ │ └─ 修订号：Bug 修复
│ └─── 次版本号：新功能（向后兼容）
└───── 主版本号：不兼容的 API 变更
```

### 发布检查清单

- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 更新版本号
- [ ] 更新 CHANGELOG.md
- [ ] 打 Git tag
- [ ] 推送到 main 分支

## 性能优化约定

### 代码分割

```js
// ✅ 使用动态 import 懒加载
const SettingDialog = defineAsyncComponent(() =>
  import('./components/dialogs/SettingDialog.vue')
)

// ❌ 不要全部同步加载
import SettingDialog from './components/dialogs/SettingDialog.vue'
```

### 避免性能陷阱

```vue
<!-- ❌ 不要在模板中使用复杂计算 -->
<div v-for="item in items.filter(i => i.active).sort()">

<!-- ✅ 使用 computed -->
<div v-for="item in activeItemsSorted">
```

### 图片优化

- 使用 WebP 格式
- 图标使用 SVG
- 大图使用 lazy loading

## Chrome Extension 特殊约定

### Manifest 修改

修改 `manifest.json` 时：
1. 确保语法正确
2. 测试权限变更
3. 在 PR 中说明变更原因

### Background Script

- 保持轻量
- 避免长时间运行任务
- 使用 Chrome API 时检查权限

### Content Script

- 隔离样式（使用 Shadow DOM）
- 避免污染页面全局变量
- 最小化注入代码

## 安全约定

### 敏感信息

- **禁止**提交 API Keys
- **禁止**提交密码/Token
- 使用 `.env` 管理环境变量
- `.env` 文件不提交到 Git

### 用户数据

- localStorage 存储注意大小限制
- 不存储敏感信息
- 提供数据导出功能

## 沟通约定

### Issue 规范

```markdown
## 问题描述
清晰描述问题

## 复现步骤
1. 打开 XXX
2. 点击 XXX
3. 看到错误

## 期望行为
应该怎样

## 实际行为
现在怎样

## 环境信息
- 浏览器：Chrome 120
- 系统：Windows 11
- 扩展版本：1.2.3
```

### 讨论规范

- 保持专业和尊重
- 讨论技术而非个人
- 提供建设性意见

---

**相关文档**:
- [代码风格](./CODE_STYLE.md) - 代码编写规范
- [架构指南](./ARCHITECTURE.md) - 系统设计和技术选型
