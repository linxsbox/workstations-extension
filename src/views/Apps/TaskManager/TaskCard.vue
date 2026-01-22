<script setup>
import { useMessage } from "naive-ui";
import IconDelete from "@/components/common/Icons/IconDelete.vue";
import IconPlayArrow from "@/components/common/Icons/IconPlayArrow.vue";
import IconStop from "@/components/common/Icons/IconStop.vue";
import IconEditNote from "@/components/common/Icons/IconEditNote.vue";
import IconRedo from "@/components/common/Icons/IconRedo.vue";
import { formatDate } from "@linxs/toolkit";
import { storeTasks } from "@/stores/miniapps/tasks";

import { TASK_STATUS, EXECUTION_RULE } from "./constants";

const props = defineProps({
  task: { type: Object, required: true },
  type: { type: String, default: TASK_STATUS.PENDING },
});

const message = useMessage();
const tasksStore = storeTasks();

const handleStart = (e) => {
  e.stopPropagation();
  tasksStore.startTask(props.task.id);
  message.success("任务已启动");
};

const handleStop = (e) => {
  e.stopPropagation();
  tasksStore.stopTask(props.task.id);
  message.info("任务已停止");
};

const handleDelete = (e) => {
  e.stopPropagation();
  tasksStore.deleteTask(props.task.id);
  message.success("任务已删除");
};

const handleReset = (e) => {
  e.stopPropagation();
  tasksStore.resetTask(props.task.id);
  message.success("任务已重置");
};

const handleEdit = (e) => {
  e.stopPropagation();
  tasksStore.openEditDialog(props.task.id);
};

// 格式化时间
const formatTime = (isoString) => {
  if (!isoString) return "-";
  return formatDate(new Date(isoString));
};

// 内容不需要截取，使用 CSS 控制显示行数

// 获取时间标签
const getTimeLabel = () => {
  if (props.type === TASK_STATUS.RUNNING) {
    return `启动于 ${formatTime(props.task.startedAt)}`;
  } else if (props.type === TASK_STATUS.COMPLETED) {
    return `完成于 ${formatTime(props.task.completedAt)}`;
  } else {
    return formatTime(props.task.updatedAt);
  }
};
</script>

<template>
  <div
    class="task-card flex flex-col gap-2 p-3 rounded-md cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
    :class="{
      running: type === TASK_STATUS.RUNNING,
      completed: type === TASK_STATUS.COMPLETED,
    }"
  >
    <!-- 标题 -->
    <div class="task-title flex justify-between items-center gap-3">
      <div
        class="title font-bold text-base truncate"
        :class="{ 'line-through': type === TASK_STATUS.COMPLETED }"
      >
        {{ task.title }}
      </div>
      <button
        class="action-btn size-5 flex justify-center items-center rounded-md"
        v-if="type === TASK_STATUS.PENDING"
        @click="handleEdit"
        title="编辑任务"
      >
        <IconEditNote class="text-xl text-[var(--color-info)]" />
      </button>
    </div>

    <!-- 内容描述 -->
    <div
      class="task-content text-sm text-[var(--text-tertiary)] line-clamp-3 leading-relaxed"
    >
      {{ task.content || "无内容" }}
    </div>

    <!-- 时间和操作按钮 -->
    <div class="task-footer flex items-center justify-between h-5">
      <div class="task-time flex gap-2 text-xs text-[var(--text-tertiary)]">
        <IconPlayArrow
          class="text-base text-[var(--color-success)]"
          v-if="type === TASK_STATUS.RUNNING"
        />
        <span>
          {{ getTimeLabel() }}
        </span>
      </div>
      <div class="action-btns gap-2 hidden">
        <!-- 待启动状态：启动、删除 -->
        <template v-if="type === TASK_STATUS.PENDING">
          <button
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="handleStart"
            title="启动"
          >
            <IconPlayArrow class="text-xl text-[var(--color-success)]" />
          </button>
          <button
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="handleDelete"
            title="删除"
          >
            <IconDelete class="text-xl text-[var(--color-error)]" />
          </button>
        </template>

        <!-- 运行中状态：停止 -->
        <template v-else-if="type === TASK_STATUS.RUNNING">
          <button
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="handleStop"
            title="停止"
          >
            <IconStop class="text-xl text-[var(--color-warning)]" />
          </button>
        </template>

        <!-- 已完成状态：重置（仅预期类型）、删除 -->
        <template v-else-if="type === TASK_STATUS.COMPLETED">
          <button
            v-if="task.executionRule === EXECUTION_RULE.EXPECTED"
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="handleReset"
            title="重置任务"
          >
            <IconRedo
              class="text-xl text-[var(--color-info)]"
              style="transform: scaleY(-1)"
            />
          </button>
          <button
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="handleDelete"
            title="删除"
          >
            <IconDelete class="text-xl text-[var(--color-error)]" />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.task-card {
  background-color: rgba(var(--task-color-rgb), 0.25);
  border: 1px solid var(--task-color);

  .action-btn {
    background-color: var(--color-white-alpha-4);
  }

  &:hover {
    .action-btns {
      display: flex;
    }
  }
}
</style>
