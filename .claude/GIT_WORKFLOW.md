# Git 工作流规范

## ⛔ 严格禁止的操作

### 1. 永远不要直接推送到 main 分支

**禁止的操作：**
- ❌ `git push origin main`
- ❌ 在 main 分支上直接提交代码
- ❌ 使用 `git push origin main --force`（除非是撤销错误操作）

**原因：**
- main 分支是受保护的生产分支
- 所有代码必须经过 Pull Request 审查
- 直接推送会破坏代码审查流程

---

## ✅ 正确的工作流程

### 功能开发流程

```bash
# 1. 确保在 main 分支并更新到最新
git checkout main
git pull origin main

# 2. 创建新的功能分支
git checkout -b feat/feature-name

# 3. 开发并提交代码
git add .
git commit -m "feat: 功能描述"

# 4. 推送功能分支到远程
bash .git-retry.sh git push -u origin feat/feature-name

# 5. 创建 Pull Request
# 6. 等待代码审查和合并
```

### Bug 修复流程

```bash
# 1. 创建修复分支
git checkout -b fix/bug-description

# 2. 修复并提交
git add .
git commit -m "fix: 修复描述"

# 3. 推送并创建 PR
bash .git-retry.sh git push -u origin fix/bug-description
```

---

## 分支命名规范

- `feat/` - 新功能开发
- `fix/` - Bug 修复
- `refactor/` - 代码重构
- `docs/` - 文档更新
- `style/` - 代码格式调整
- `test/` - 测试相关
- `chore/` - 构建/工具相关

**示例：**
- `feat/notes-share-function`
- `fix/player-delete-bug`
- `refactor/optimize-performance`

---

## 提交信息规范

使用约定式提交（Conventional Commits）格式：

```
<type>: <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 重构
- `docs`: 文档
- `style`: 格式
- `test`: 测试
- `chore`: 构建/工具
- `perf`: 性能优化

### 提交信息示例

```
feat: 添加笔记分享功能

- 支持分享整篇文章和选中内容
- 添加智能文本截取算法
- 实现高亮显示选中部分
```

```
fix: 修复播放器删除最后一首歌的问题

- 删除前检查列表是否只剩一首
- 直接停止播放避免循环加载
```

---

## 紧急情况处理

### 如果不小心直接推送到 main

**立即执行以下步骤：**

```bash
# 1. 回退本地提交
git reset --hard HEAD~1

# 2. 强制推送撤销远程提交
git push origin main --force

# 3. 创建正确的功能分支
git checkout -b fix/correct-branch-name

# 4. 重新提交并走正常流程
git add .
git commit -m "fix: 修复描述"
bash .git-retry.sh git push -u origin fix/correct-branch-name
```

---

## 操作前检查清单

在执行任何 git 操作前，请确认：

- [ ] 当前在正确的分支上（使用 `git branch` 查看）
- [ ] 不在 main 分支上进行提交
- [ ] 推送的目标分支是功能分支而非 main
- [ ] 提交信息符合规范
- [ ] 已使用 `git status` 确认要提交的文件

---

## 常用命令

```bash
# 查看当前分支
git branch

# 查看当前状态
git status

# 查看提交历史
git log --oneline -5

# 切换分支
git checkout branch-name

# 拉取最新代码
bash .git-retry.sh git pull origin main

# 推送分支（使用重试脚本）
bash .git-retry.sh git push -u origin branch-name
```

---

## 注意事项

⚠️ **重要提醒：**

1. 所有代码变更必须通过 Pull Request
2. 在推送前务必确认目标分支
3. 使用 `.git-retry.sh` 脚本处理网络不稳定问题
4. 重要操作前先与用户确认
5. 保持提交信息清晰、规范

---

## 代码审查要求

1. PR 必须包含清晰的描述
2. 说明改动的原因和影响范围
3. 提供测试说明（如适用）
4. 重大变更需要详细的设计文档
