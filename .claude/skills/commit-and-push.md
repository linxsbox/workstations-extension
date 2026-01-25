# Commit and Push

自动化 Git 提交和推送流程，确保代码安全地提交到新分支并推送到远程仓库。

## Usage

当用户说以下内容时触发：
- "提交代码"
- "commit"
- "推送代码"
- "我要提交"

## Implementation

### 步骤 1: 检查当前分支状态

```bash
git branch --show-current
```

- 如果当前在主分支（main/master）→ 继续步骤 2
- 如果不在主分支 → 询问用户是否切换到主分支
  - 用户确认 → 执行 `git checkout main` 或 `git checkout master`
  - 用户拒绝 → 终止流程

### 步骤 2: 拉取最新代码

```bash
./.claude/scripts/git-retry.sh pull origin main
```

确保本地主分支与远程同步。

### 步骤 3: 创建新分支

询问用户输入新分支名称，建议格式：
- `feat/功能描述` - 新功能
- `fix/问题描述` - Bug 修复
- `refactor/重构描述` - 代码重构
- `docs/文档描述` - 文档更新

```bash
git checkout -b <分支名>
```

### 步骤 4: 确认待提交文件

```bash
git status
git diff --cached --stat
```

询问用户："是否已经处理好需要提交的文件？"
- 是 → 继续步骤 5
- 否 → 暂停流程，等待用户处理
- 查看详细改动 → 执行 `git diff --cached`

### 步骤 5: 编写提交信息

询问用户提交内容描述，格式：

```
<type>: <简短描述>

<详细描述>
- 变更点 1
- 变更点 2

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

Type 类型：feat, fix, refactor, docs, style, perf, test, chore

执行提交：

```bash
git commit -m "$(cat <<'EOF'
<提交信息>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### 步骤 6: 推送到远程

```bash
./.claude/scripts/git-retry.sh push -u origin <分支名>
```

使用 git-retry.sh 自动处理网络问题（最多重试 10 次）。

推送成功后，提示用户：
```
✅ 代码已成功推送到远程分支 <分支名>

💡 提示：如需创建 Pull Request，请访问 GitHub 仓库页面或使用 gh CLI 工具。
```

### 步骤 7: 切回主分支

```bash
git checkout main
```

保持工作区整洁，为下次开发做准备。

## Safety Checks

### 禁止的操作
- 不允许直接在主分支（main/master）上提交代码
- 不允许使用 `--force` 强制推送
- 不允许使用 `--no-verify` 跳过 hooks
- 不允许推送到 main/master 分支

### 必须的检查
- 确保从主分支创建新分支
- 确保主分支是最新的（已拉取）
- 确保用户确认了待提交的文件
- 使用 git-retry.sh 进行推送
- 推送成功后切回主分支

## Error Handling

### 当前不在主分支
提示用户是否切换到主分支，用户拒绝则终止流程。

### 有未提交的更改
提示用户先使用 `git add` 暂存文件或 `git stash` 暂存更改，终止流程。

### 分支名已存在
提示用户选择其他名称或删除现有分支，重新询问分支名。

### 推送失败
显示错误信息，不切换回主分支（保留在当前分支），提示用户检查网络或手动推送。

## Notes

- 使用 .claude/scripts/git-retry.sh 脚本处理网络不稳定问题
- 每次推送最多重试 10 次，间隔 20 秒
- 所有代码变更必须通过功能分支提交，推送后可创建 Pull Request 进行代码审查
