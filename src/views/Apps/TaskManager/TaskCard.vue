<script setup>
import IconDelete from "@/components/common/Icons/IconDelete.vue";
import IconPlayArrow from "@/components/common/Icons/IconPlayArrow.vue";
import IconStop from "@/components/common/Icons/IconStop.vue";
import IconEditNote from "@/components/common/Icons/IconEditNote.vue";

import { TASK_STATUS } from "./constants";

const props = defineProps({
  task: { type: Object, required: true },
  type: { type: String, default: TASK_STATUS.PENDING },
});

const emit = defineEmits(["start", "stop", "complete", "delete", "edit"]);

// 格式化时间
const formatTime = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
    class="task-card flex flex-col gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
        @click="emit('edit', task.id, $event)"
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
            @click="emit('start', task.id, $event)"
            title="启动"
          >
            <IconPlayArrow class="text-xl text-[var(--color-success)]" />
          </button>
          <button
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="emit('delete', task.id, $event)"
            title="删除"
          >
            <IconDelete class="text-xl text-[var(--color-error)]" />
          </button>
        </template>

        <!-- 运行中状态：停止 -->
        <template v-else-if="type === TASK_STATUS.RUNNING">
          <button
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="emit('stop', task.id, $event)"
            title="停止"
          >
            <IconStop class="text-xl text-[var(--color-warning)]" />
          </button>
        </template>

        <!-- 已完成状态：删除 -->
        <template v-else-if="type === TASK_STATUS.COMPLETED">
          <button
            class="action-btn size-5 flex justify-center items-center rounded-md"
            @click="emit('delete', task.id, $event)"
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
