# Claude 开发约束

## ⛔ 严格禁止的操作

1. **禁止提交到主分支** - 不要在 main 分支上直接提交代码
2. **禁止推送到主分支** - 不要执行 `git push origin main`
3. **禁止自动推送** - 任何推送操作必须经过用户确认

所有代码变更必须通过功能分支 + Pull Request 流程。

详细的 Git 工作流规范请参考：`.claude/GIT_WORKFLOW.md`

---

## 技术栈约束

### CSS 样式
- **优先使用 Tailwind CSS** - 使用 Tailwind 工具类而非自定义 CSS
- 复杂交互样式可尝试使用 `@apply` 指令组合 Tailwind 类

### Vue 3 组件规范
- **UI 组件库**: Naive UI
- **组件命名**: template 中使用大驼峰命名（PascalCase）
  ```vue
  <!-- ✅ 正确 -->
  <NButton>按钮</NButton>
  <NModal>弹窗</NModal>

  <!-- ❌ 错误 -->
  <n-button>按钮</n-button>
  <n-modal>弹窗</n-modal>
  ```

---

## 开发流程

1. 创建功能分支（feat/、fix/、refactor/ 等）
2. 在功能分支上开发和提交
3. 推送功能分支到远程
4. 创建 Pull Request
5. 等待代码审查和合并

**重要**: 推送前务必与用户确认！
