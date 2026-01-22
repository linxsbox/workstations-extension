import { defineStore } from "pinia";
import { storageManager, WEB_STORAGE_KEYS } from "@/stores/storage";

/**
 * 任务管理 Store
 * 统一管理所有任务数据，供各个组件使用
 */
export const storeTasks = defineStore("tasks", {
  state: () => ({
    tasks: [],
    // UI 状态
    showCreateDialog: false,
    editingTaskId: null,
  }),

  getters: {
    /**
     * 获取所有任务
     */
    allTasks: (state) => state.tasks,

    /**
     * 待启动任务
     */
    pendingTasks: (state) => {
      return state.tasks.filter((t) => t.status === "pending");
    },

    /**
     * 运行中任务
     */
    runningTasks: (state) => {
      return state.tasks.filter((t) => t.status === "running");
    },

    /**
     * 已完成任务
     */
    completedTasks: (state) => {
      return state.tasks.filter((t) => t.status === "completed");
    },

    /**
     * 获取近期任务（优先进行中，然后待执行，最多3个）
     */
    recentTasks: (state) => {
      const running = state.tasks.filter((t) => t.status === "running");
      const pending = state.tasks.filter((t) => t.status === "pending");
      const combined = [...running, ...pending];
      return combined.slice(0, 3);
    },

    /**
     * 根据 ID 获取任务
     */
    getTaskById: (state) => (id) => {
      return state.tasks.find((t) => t.id === id);
    },
  },

  actions: {
    /**
     * 初始化任务数据
     */
    init() {
      const savedTasks = storageManager.get(WEB_STORAGE_KEYS.TODOS) || [];
      this.tasks = savedTasks;
    },

    /**
     * 保存任务到存储
     */
    saveTasks() {
      storageManager.set(WEB_STORAGE_KEYS.TODOS, this.tasks);
    },

    /**
     * 添加任务
     */
    addTask(task) {
      this.tasks.unshift(task);
      this.saveTasks();
    },

    /**
     * 更新任务
     */
    updateTask(taskId, updates) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        Object.assign(task, updates);
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
      }
    },

    /**
     * 删除任务
     */
    deleteTask(taskId) {
      const index = this.tasks.findIndex((t) => t.id === taskId);
      if (index > -1) {
        this.tasks.splice(index, 1);
        this.saveTasks();
      }
    },

    /**
     * 启动任务
     */
    startTask(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = "running";
        task.startedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
      }
    },

    /**
     * 停止任务
     */
    stopTask(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = "pending";
        task.startedAt = null;
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
      }
    },

    /**
     * 完成任务
     */
    completeTask(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task && task.status === "running") {
        task.status = "completed";
        task.completedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
      }
    },

    /**
     * 重置任务（仅预期类型的已完成任务）
     */
    resetTask(taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task && task.status === "completed" && task.executionRule === "expected") {
        task.status = "pending";
        task.startedAt = null;
        task.completedAt = null;
        task.updatedAt = new Date().toISOString();
        this.saveTasks();
      }
    },

    /**
     * 打开编辑任务对话框
     */
    openEditDialog(taskId) {
      this.editingTaskId = taskId;
      this.showCreateDialog = true;
    },

    /**
     * 打开创建任务对话框
     */
    openCreateDialog() {
      this.editingTaskId = null;
      this.showCreateDialog = true;
    },

    /**
     * 关闭创建/编辑对话框
     */
    closeCreateDialog() {
      this.showCreateDialog = false;
      this.editingTaskId = null;
    },
  },
});
