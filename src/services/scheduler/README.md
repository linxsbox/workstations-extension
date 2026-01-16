# Task Scheduler Service

通用任务调度服务，提供基于时间的任务调度能力。

## 特性

- ✅ **Chrome Extension Alarms API 优先**：精确、可靠、省电
- ✅ **Web Service Worker 降级**：非扩展环境自动降级
- ✅ **持久化存储**：刷新页面不丢失任务
- ✅ **事件驱动**：灵活的任务监听机制
- ✅ **单例模式**：全局唯一实例，避免重复调度

## 架构设计

### Chrome Extension 方案（优先）
```
TaskScheduler
    ↓
chrome.alarms.create()
    ↓
chrome.alarms.onAlarm
    ↓
触发回调 + 发送通知
```

**优势：**
- 精确触发（误差 < 1秒）
- 不受页面生命周期影响
- 浏览器原生支持，省电
- 可以在后台触发

### Web 方案（降级）
```
TaskScheduler
    ↓
setInterval 定时检查
    ↓
检查任务是否到期
    ↓
触发回调 + 发送通知
```

**限制：**
- 检查间隔 60秒（可能有延迟）
- 页面关闭后失效
- 依赖页面活跃状态

## 使用方法

### 1. 基本使用

```javascript
import TaskScheduler from "@/services/scheduler";

// 调度任务（1小时后触发）
await TaskScheduler.schedule({
  id: "task-001",
  triggerAt: Date.now() + 3600000,
  data: {
    title: "任务标题",
    content: "任务内容"
  }
});

// 监听任务触发
TaskScheduler.on("task-001", (data) => {
  console.log("任务触发", data);
  // 发送通知、更新状态等
});

// 取消任务
await TaskScheduler.cancel("task-001");
```

### 2. 结合任务管理使用

```javascript
// AppIndex.vue
import TaskScheduler from "@/services/scheduler";
import { TASK_STATUS } from "./constants";

// 启动任务时创建调度
const handleStartTask = async (taskId) => {
  const task = tasks.value.find(t => t.id === taskId);

  // 计算触发时间
  let triggerAt;
  if (task.executionRule === EXECUTION_RULE.EXPECTED) {
    triggerAt = Date.now() + task.expectedDuration * 60000;
  } else {
    triggerAt = task.scheduledTime;
  }

  // 创建调度
  await TaskScheduler.schedule({
    id: taskId,
    triggerAt,
    data: { title: task.title, content: task.content }
  });

  // 监听触发
  TaskScheduler.on(taskId, async (data) => {
    // 自动完成任务
    const task = tasks.value.find(t => t.id === taskId);
    if (task) {
      task.status = TASK_STATUS.COMPLETED;
      task.completedAt = new Date().toISOString();
      saveTasks();
    }

    // 发送通知
    sendNotification("任务完成", `任务"${data.title}"已完成！`);
  });

  // 更新任务状态
  task.status = TASK_STATUS.RUNNING;
  task.startedAt = new Date().toISOString();
  saveTasks();
};

// 停止任务时取消调度
const handleStopTask = async (taskId) => {
  await TaskScheduler.cancel(taskId);

  const task = tasks.value.find(t => t.id === taskId);
  task.status = TASK_STATUS.PENDING;
  task.startedAt = null;
  saveTasks();
};

// 初始化时恢复运行中的任务
onMounted(async () => {
  // TaskScheduler 会自动恢复存储的任务
  // 只需要重新注册监听器
  const runningTasks = tasks.value.filter(t => t.status === TASK_STATUS.RUNNING);

  runningTasks.forEach(task => {
    TaskScheduler.on(task.id, async (data) => {
      // 处理任务完成
      const t = tasks.value.find(t => t.id === task.id);
      if (t) {
        t.status = TASK_STATUS.COMPLETED;
        t.completedAt = new Date().toISOString();
        saveTasks();
      }
      sendNotification("任务完成", `任务"${data.title}"已完成！`);
    });
  });
});
```

### 3. 批量操作

```javascript
// 获取所有任务
const allTasks = TaskScheduler.getTasks();

// 获取指定任务
const task = TaskScheduler.getTask("task-001");

// 清理所有任务
await TaskScheduler.clearAll();
```

## API 文档

### `schedule(options)`
调度新任务

**参数：**
- `options.id` (string): 任务唯一标识
- `options.triggerAt` (number): 触发时间戳（毫秒）
- `options.data` (any): 任务数据

**返回：** Promise<void>

### `cancel(taskId)`
取消任务

**参数：**
- `taskId` (string): 任务ID

**返回：** Promise<void>

### `on(taskId, callback)`
监听任务触发

**参数：**
- `taskId` (string): 任务ID
- `callback` (Function): 回调函数 `(data) => void`

### `off(taskId)`
移除监听器

**参数：**
- `taskId` (string): 任务ID

### `getTask(taskId)`
获取指定任务

**参数：**
- `taskId` (string): 任务ID

**返回：** Task | undefined

### `getTasks()`
获取所有任务

**返回：** Task[]

### `clearAll()`
清理所有任务

**返回：** Promise<void>

## 注意事项

### Chrome Extension 环境
1. **Manifest V3 要求**：确保在 `manifest.json` 中声明 `alarms` 权限
   ```json
   {
     "permissions": ["alarms", "storage"]
   }
   ```

2. **最小延迟**：Chrome Alarms 最小延迟为 1 分钟（测试模式下可以更短）

3. **Service Worker**：Alarms 在 Service Worker 中触发，确保注册了 `onAlarm` 监听器

### Web 环境
1. **精度限制**：降级方案检查间隔为 60 秒，可能有延迟
2. **页面生命周期**：页面关闭后任务会失效
3. **浏览器节流**：非活跃标签页可能被节流

## 最佳实践

1. **任务 ID 管理**：使用有意义的 ID（如 `task-${timestamp}` 或 `user-${userId}-task-${id}`）

2. **数据最小化**：`data` 字段只存储必要数据，大对象应通过 ID 引用

3. **错误处理**：回调函数应包含 try-catch

4. **清理机制**：任务完成或取消后及时清理

5. **重复调度**：相同 ID 的任务会覆盖旧任务

## 扩展计划

- [ ] 支持重复任务（每天、每周等）
- [ ] 支持任务优先级
- [ ] 支持任务依赖链
- [ ] 添加任务执行历史记录
- [ ] 支持 IndexedDB 存储大量任务
