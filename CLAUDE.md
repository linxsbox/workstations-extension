# Workstations Extension

Chrome 扩展项目，提供工作站管理和同步功能。

## 项目概述

这是一个 Chrome 扩展，使用 TypeScript 和 React 开发，提供以下核心功能：
- Service Worker 事件总线架构
- WebRTC 移动端同步
- 工作站管理

## 技术栈

- TypeScript
- React
- Chrome Extension APIs
- WebRTC
- Service Worker

## 项目结构

详细的架构文档请参考：
- `.claude/ARCHITECTURE.md` - 架构设计
- `.claude/CODE_STYLE.md` - 代码规范
- `.claude/CONVENTIONS.md` - 开发约定
- `.claude/GIT_WORKFLOW.md` - Git 工作流

## Custom Skills

本项目配置了以下自定义 skills：

### pull-branch
拉取并更新分支代码，使用 git-retry.sh 处理网络不稳定问题。

**触发词：**
- "拉取代码"
- "更新分支"
- "pull"
- "同步代码"

**文件位置：** `.claude/skills/pull-branch.md`

### commit-and-push
自动化 Git 提交和推送工作流，包括代码检查和网络重试。

**触发词：**
- "提交代码"
- "推送代码"
- "commit"
- "push"

**文件位置：** `.claude/skills/commit-and-push.md`

## 开发指南

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

## Git 工作流

- 主分支：`main`
- 功能分支：`feat/*`
- 修复分支：`fix/*`

详细的 Git 工作流程请参考 `.claude/GIT_WORKFLOW.md`
