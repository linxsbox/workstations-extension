<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { NModal, NButton, useMessage, useNotification } from "naive-ui";
import { storeApp } from "@/stores/global/app";
import { storeTasks } from "@/stores/miniapps/tasks";
import IconTaskAlt from "@/components/common/Icons/IconTaskAlt.vue";
import IconAddTask from "@/components/common/Icons/IconAddTask.vue";
import CreateTaskDialog from "./CreateTaskDialog.vue";
import TaskList from "./TaskList.vue";
import TaskScheduler from "@/services/scheduler";
import { TASK_STATUS, EXECUTION_RULE, NOTIFICATION_CONFIG } from "./constants";

const message = useMessage();
const notification = useNotification();
const appStore = storeApp();
const tasksStore = storeTasks();

// UI 状态
const showTaskDialog = ref(false);

// 从 store 获取任务数据
const pendingTasks = computed(() => tasksStore.pendingTasks);
const runningTasks = computed(() => tasksStore.runningTasks);
const completedTasks = computed(() => tasksStore.completedTasks);

// 打开任务管理
const handleOpenTasks = () => {
  showTaskDialog.value = true;
};

// 打开创建任务弹窗
const handleOpenCreateDialog = () => {
  tasksStore.openCreateDialog();
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

  tasksStore.addTask(newTask);

  // 如果是创建并启动，设置调度
  if (taskData.createAndStart) {
    await setupTaskScheduler(newTask);
  }

  tasksStore.closeCreateDialog();
  message.success(
    taskData.createAndStart ? "任务已创建并启动" : "任务创建成功"
  );
};

// 更新任务
const handleUpdateTask = async (taskData) => {
  tasksStore.updateTask(tasksStore.editingTaskId, {
    title: taskData.title,
    content: taskData.content,
    executionRule: taskData.executionRule,
    expectedDuration: taskData.expectedDuration || null,
    scheduledTime: taskData.scheduledTime || null,
  });

  tasksStore.closeCreateDialog();
  message.success("任务已更新");
};

// 初始化时恢复所有运行中任务
onMounted(async () => {
  // 初始化 tasks store
  tasksStore.init();

  // 初始化调度器
  await TaskScheduler.init();

  // 重新注册所有运行中任务的监听器
  runningTasks.value.forEach((task) => {
    TaskScheduler.on(task.id, async (data) => {
      // 自动完成任务
      tasksStore.completeTask(task.id);

      // 发送通知
      sendNotification("任务完成", `任务"${data.title}"已完成！`);
    });
  });

  // 请求通知权限
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
});

// 监听 app store 的任务对话框状态
watch(() => appStore.showTasksDialog, (show) => {
  if (show) {
    handleOpenTasks();
    appStore.closeTasksDialog();
  }
});

// 暴露方法供外部调用
defineExpose({
  handleOpenTasks,
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
      aria-label="打开任务管理"
    >
      <IconTaskAlt class="text-2xl" />
      <!-- 运行中指示器 -->
      <div v-if="runningTasks.length > 0" class="indicator">
        {{ runningTasks.length }}
      </div>
    </button>
    <!-- APP标签 -->
    <div class="app-label">任务</div>

    <!-- 创建/编辑任务弹窗 -->
    <CreateTaskDialog
      v-model:show="tasksStore.showCreateDialog"
      :editing-task-id="tasksStore.editingTaskId"
      :tasks="tasksStore.allTasks"
      @create="handleCreateTask"
      @update="handleUpdateTask"
    />

    <!-- 任务管理弹窗 -->
    <NModal
      v-model:show="showTaskDialog"
      preset="card"
      title="任务管理"
      class="task-modal w-[1200px] h-[95vh]"
      content-class="overflow-hidden"
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
        >
          <template #header-extra>
            <NButton
              type="primary"
              size="small"
              @click="handleOpenCreateDialog"
            >
              <template #icon>
                <IconAddTask />
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
        />
      </div>
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
