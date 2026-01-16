<script setup>
import { NScrollbar, NEmpty } from "naive-ui";
import TaskCard from "./TaskCard.vue";
import { TASK_STATUS } from "./constants";

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  type: { type: String, default: TASK_STATUS.PENDING },
  title: { type: String, required: true },
  emptyText: { type: String, default: "暂无任务" },
});

const emit = defineEmits(["start", "stop", "complete", "delete"]);
</script>

<template>
  <div
    class="task-list flex-1 flex flex-col rounded-lg overflow-hidden shadow-md"
  >
    <div class="list-header p-3 border-b">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-base text-white font-semibold">{{ title }}</div>
          <div class="text-xs text-gray-100 mt-1">
            {{ tasks.length }} 个任务
          </div>
        </div>
        <slot name="header-extra"></slot>
      </div>
    </div>
    <NScrollbar class="list-panel flex-1">
      <div class="p-2">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :type="type"
          @start="(id, event) => emit('start', id, event)"
          @stop="(id, event) => emit('stop', id, event)"
          @complete="(id, event) => emit('complete', id, event)"
          @delete="(id, event) => emit('delete', id, event)"
        />

        <NEmpty
          v-if="tasks.length === 0"
          :description="emptyText"
          class="text-gray-100 mt-10"
        />
      </div>
    </NScrollbar>
  </div>
</template>

<style lang="scss" scoped>
.task-list {
  border: 1px solid var(--task-color);

  :deep(.list-header) {
    background-color: rgba(var(--task-color-rgb), 0.75);
    border-color: var(--task-color);
  }
  :deep(.list-panel) {
    background-color: rgba(var(--task-color-rgb), 0.3);
  }
}
</style>
