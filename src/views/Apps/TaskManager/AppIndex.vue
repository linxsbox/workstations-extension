<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { NModal, NButton, useMessage, useNotification } from "naive-ui";
import { storageManager, WEB_STORAGE_KEYS } from "@/stores/storage";
import IconAddTask from "@/components/common/Icons/IconAddTask.vue";
import IconTaskAlt from "@/components/common/Icons/IconTaskAlt.vue";
import CreateTaskDialog from "./CreateTaskDialog.vue";
import TaskList from "./TaskList.vue";
import TaskScheduler from "@/services/scheduler";
import { TASK_STATUS, EXECUTION_RULE, NOTIFICATION_CONFIG } from "./constants";

const message = useMessage();
const notification = useNotification();

// 任务数据
const tasks = ref(storageManager.get(WEB_STORAGE_KEYS.TODOS) || []);
const showTaskDialog = ref(false);
const showCreateDialog = ref(false);
const editingTaskId = ref(null); // 正在编辑的任务ID
const showExpiredDialog = ref(false); // 显示过期提示对话框
const expiredTaskId = ref(null); // 过期的任务ID

// 待启动任务
const pendingTasks = computed(() => {
  return tasks.value.filter((t) => t.status === TASK_STATUS.PENDING);
});

// 运行中任务
const runningTasks = computed(() => {
  return tasks.value.filter((t) => t.status === TASK_STATUS.RUNNING);
});

// 已完成任务
const completedTasks = computed(() => {
  return tasks.value.filter((t) => t.status === TASK_STATUS.COMPLETED);
});

// 打开任务管理
const handleOpenTasks = () => {
  showTaskDialog.value = true;
};

// 打开创建任务弹窗
const handleOpenCreateDialog = () => {
  showCreateDialog.value = true;
};

// 页签闪烁提醒
let titleFlashInterval = null;
const startTitleFlash = (message) => {
  if (document.hidden) {
    const originalTitle = document.title;
    let isOriginal = true;

    titleFlashInterval = setInterval(() => {
      document.title = isOriginal ? `🔔 ${message}` : originalTitle;
      isOriginal = !isOriginal;
    }, 1000);

    // 页面可见时停止闪烁
    const stopFlash = () => {
      if (!document.hidden) {
        clearInterval(titleFlashInterval);
        document.title = originalTitle;
        document.removeEventListener("visibilitychange", stopFlash);
      }
    };
    document.addEventListener("visibilitychange", stopFlash);
  }
};

// 发送通知
const sendNotification = (title, body) => {
  // 触发页签闪烁
  startTitleFlash(title);

  // 优先使用浏览器原生通知
  if ("Notification" in window && Notification.permission === "granted") {
    const notif = new Notification(title, {
      body,
      icon: NOTIFICATION_CONFIG.ICON,
    });

    // 点击通知时聚焦到当前页面
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } else if ("Notification" in window && Notification.permission !== "denied") {
    // 请求权限
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const notif = new Notification(title, {
          body,
          icon: NOTIFICATION_CONFIG.ICON,
        });

        // 点击通知时聚焦到当前页面
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } else {
        // 降级使用 Naive UI 通知
        notification.info({
          title,
          content: body,
          duration: NOTIFICATION_CONFIG.DURATION,
        });
      }
    });
  } else {
    // 降级使用 Naive UI 通知
    notification.info({
      title,
      content: body,
      duration: NOTIFICATION_CONFIG.DURATION,
    });
  }
};

// 设置任务调度
const setupTaskScheduler = async (task) => {
  if (task.status !== TASK_STATUS.RUNNING) return;

  let triggerAt;
  if (task.executionRule === EXECUTION_RULE.EXPECTED) {
    // 预期时间：从启动时间开始计算
    triggerAt =
      new Date(task.startedAt).getTime() + task.expectedDuration * 60000;
  } else {
    // 计划时间：到指定时间点
    triggerAt = task.scheduledTime;
  }

  // 创建调度
  await TaskScheduler.schedule({
    id: task.id,
    triggerAt,
    data: {
      title: task.title,
      content: task.content,
    },
  });

  // 监听任务触发
  TaskScheduler.on(task.id, async (data) => {
    // 自动完成任务
    const t = tasks.value.find((item) => item.id === task.id);
    if (t && t.status === TASK_STATUS.RUNNING) {
      t.status = TASK_STATUS.COMPLETED;
      t.completedAt = new Date().toISOString();
      t.updatedAt = new Date().toISOString();
      saveTasks();
    }

    // 发送通知
    sendNotification("任务完成", `任务"${data.title}"已完成！`);
  });
};

// 创建任务
const handleCreateTask = async (taskData) => {
  const newTask = {
    id: Date.now().toString(),
    title: taskData.title,
    content: taskData.content,
    status: taskData.createAndStart ? TASK_STATUS.RUNNING : TASK_STATUS.PENDING,
    executionRule: taskData.executionRule,
    expectedDuration: taskData.expectedDuration || null,
    scheduledTime: taskData.scheduledTime || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: taskData.createAndStart ? new Date().toISOString() : null,
    completedAt: null,
  };

  tasks.value.unshift(newTask);
  saveTasks();

  // 如果是创建并启动，设置调度
  if (taskData.createAndStart) {
    await setupTaskScheduler(newTask);
  }

  showCreateDialog.value = false;
  editingTaskId.value = null;
  message.success(
    taskData.createAndStart ? "任务已创建并启动" : "任务创建成功"
  );
};

// 编辑任务
const handleEditTask = (taskId, event) => {
  event.stopPropagation();
  editingTaskId.value = taskId;
  showCreateDialog.value = true;
};

// 更新任务
const handleUpdateTask = async (taskData) => {
  const task = tasks.value.find((t) => t.id === editingTaskId.value);
  if (task) {
    task.title = taskData.title;
    task.content = taskData.content;
    task.executionRule = taskData.executionRule;
    task.expectedDuration = taskData.expectedDuration || null;
    task.scheduledTime = taskData.scheduledTime || null;
    task.updatedAt = new Date().toISOString();
    saveTasks();

    showCreateDialog.value = false;
    editingTaskId.value = null;
    message.success("任务已更新");
  }
};

// 启动任务
const handleStartTask = async (taskId, event) => {
  event.stopPropagation();
  const task = tasks.value.find((t) => t.id === taskId);
  if (task) {
    // 检查计划时间是否已过期
    if (task.executionRule === EXECUTION_RULE.SCHEDULED) {
      if (task.scheduledTime <= Date.now()) {
        expiredTaskId.value = taskId;
        showExpiredDialog.value = true;
        return;
      }
    }

    task.status = TASK_STATUS.RUNNING;
    task.startedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    saveTasks();
    await setupTaskScheduler(task);
    message.success("任务已启动");
  }
};

// 处理过期任务 - 重新编辑
const handleExpiredTaskEdit = () => {
  showExpiredDialog.value = false;
  handleEditTask(expiredTaskId.value, { stopPropagation: () => {} });
  expiredTaskId.value = null;
};

// 处理过期任务 - 稍后处理
const handleExpiredTaskLater = () => {
  showExpiredDialog.value = false;
  expiredTaskId.value = null;
};

// 停止任务
const handleStopTask = async (taskId, event) => {
  event.stopPropagation();
  const task = tasks.value.find((t) => t.id === taskId);
  if (task) {
    task.status = TASK_STATUS.PENDING;
    task.startedAt = null;
    task.updatedAt = new Date().toISOString();
    await TaskScheduler.cancel(taskId);
    saveTasks();
    message.info("任务已停止");
  }
};

// 完成任务
const handleCompleteTask = async (taskId, event) => {
  event.stopPropagation();
  const task = tasks.value.find((t) => t.id === taskId);
  if (task && task.status === TASK_STATUS.RUNNING) {
    task.status = TASK_STATUS.COMPLETED;
    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    await TaskScheduler.cancel(taskId);
    saveTasks();
    message.success("任务已完成");
  }
};

// 删除任务
const handleDeleteTask = async (taskId, event) => {
  event.stopPropagation();
  const index = tasks.value.findIndex((t) => t.id === taskId);
  if (index > -1) {
    await TaskScheduler.cancel(taskId);
    tasks.value.splice(index, 1);
    saveTasks();
    message.success("任务已删除");
  }
};

// 保存到存储
const saveTasks = () => {
  storageManager.set(WEB_STORAGE_KEYS.TODOS, tasks.value);
};

// 初始化时恢复所有运行中任务
onMounted(async () => {
  // 初始化调度器
  await TaskScheduler.init();

  // 重新注册所有运行中任务的监听器
  runningTasks.value.forEach((task) => {
    TaskScheduler.on(task.id, async (data) => {
      // 自动完成任务
      const t = tasks.value.find((item) => item.id === task.id);
      if (t && t.status === TASK_STATUS.RUNNING) {
        t.status = TASK_STATUS.COMPLETED;
        t.completedAt = new Date().toISOString();
        t.updatedAt = new Date().toISOString();
        saveTasks();
      }

      // 发送通知
      sendNotification("任务完成", `任务"${data.title}"已完成！`);
    });
  });

  // 请求通知权限
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});

// 组件卸载时不需要手动清理（TaskScheduler 会处理）
onUnmounted(() => {
  // TaskScheduler 在 Service Worker 或 Extension 环境中会持续运行
  // 不需要手动清理
});
</script>

<template>
  <div class="task-manager-app flex flex-col items-center gap-1">
    <!-- 任务APP图标 -->
    <button
      class="app-icon"
      :class="{ active: showTaskDialog }"
      @click="handleOpenTasks"
      title="打开任务管理"
    >
      <IconAddTask class="text-2xl" />
      <!-- 运行中指示器 -->
      <div v-if="runningTasks.length > 0" class="indicator">
        {{ runningTasks.length }}
      </div>
    </button>
    <!-- APP标签 -->
    <div class="app-label">任务</div>

    <!-- 创建/编辑任务弹窗 -->
    <CreateTaskDialog
      v-model:show="showCreateDialog"
      :editing-task-id="editingTaskId"
      :tasks="tasks"
      @create="handleCreateTask"
      @update="handleUpdateTask"
    />

    <!-- 任务管理弹窗 -->
    <NModal
      v-model:show="showTaskDialog"
      preset="card"
      title="任务管理"
      class="task-modal w-[1200px] h-[95vh]"
      :mask-closable="false"
      :close-on-esc="true"
    >
      <div class="task-container flex h-full gap-3">
        <!-- 待启动列表 -->
        <TaskList
          class="pending-list"
          :style="{
            '--task-color': 'var(--color-warning)',
            '--task-color-rgb': 'var(--color-warning-rgb)',
          }"
          :tasks="pendingTasks"
          :type="TASK_STATUS.PENDING"
          title="📋 待启动"
          empty-text="暂无待启动任务"
          @start="handleStartTask"
          @edit="handleEditTask"
          @delete="handleDeleteTask"
        >
          <template #header-extra>
            <NButton
              type="primary"
              size="small"
              @click="handleOpenCreateDialog"
            >
              <template #icon>
                <IconTaskAlt />
              </template>
              新建任务
            </NButton>
          </template>
        </TaskList>

        <!-- 运行中列表 -->
        <TaskList
          class="running-list"
          :style="{
            '--task-color': 'var(--color-info)',
            '--task-color-rgb': 'var(--color-info-rgb)',
          }"
          :tasks="runningTasks"
          :type="TASK_STATUS.RUNNING"
          title="🚀 进行中"
          empty-text="暂无运行中任务"
          @complete="handleCompleteTask"
          @stop="handleStopTask"
        />

        <!-- 已完成列表 -->
        <TaskList
          class="completed-list"
          :style="{
            '--task-color': 'var(--color-success)',
            '--task-color-rgb': 'var(--color-success-rgb)',
          }"
          :tasks="completedTasks"
          :type="TASK_STATUS.COMPLETED"
          title="✅ 已完成"
          empty-text="暂无已完成任务"
          @delete="handleDeleteTask"
        />
      </div>
    </NModal>

    <!-- 计划时间过期提示对话框 -->
    <NModal
      v-model:show="showExpiredDialog"
      preset="dialog"
      title="计划时间已过期"
      :show-icon="false"
      :style="{ width: '400px' }"
    >
      <div class="text-center py-4">
        <p class="text-base mb-2">计划时间已过期</p>
        <p class="text-sm text-[var(--text-tertiary)]">请编辑任务重新设置时间</p>
      </div>
      <template #action>
        <div class="flex gap-3 justify-end">
          <NButton @click="handleExpiredTaskLater">稍后处理</NButton>
          <NButton type="primary" @click="handleExpiredTaskEdit">重新编辑</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.task-manager-app {
  .app-icon {
    // 运行中指示器
    .indicator {
      @apply absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold;
      background-color: #4caf50;
      color: white;
      border: 2px solid var(--bg-primary);
    }
  }
}
</style>
