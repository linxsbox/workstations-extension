<script setup>
import { computed, onMounted } from "vue";
import { NEmpty, NCard } from "naive-ui";
import { storeTasks } from "@/stores/miniapps/tasks";
import { storeNotes } from "@/stores/miniapps/notes";
import { storeHome } from "@/stores/modules/home";
import { storeApp } from "@/stores/global/app";
import { formatDate } from "@linxs/toolkit";
import TaskCard from "@/views/Apps/TaskManager/TaskCard.vue";
import NoteCard from "@/views/Apps/Notes/NoteCard.vue";
import RecentSitesList from "./RecentSitesList.vue";
import IconAddTask from "@/components/common/Icons/IconAddTask.vue";
import IconAssignmentAdd from "@/components/common/Icons/IconAssignmentAdd.vue";

const tasksStore = storeTasks();
const notesStore = storeNotes();
const homeStore = storeHome();
const appStore = storeApp();

// 获取任务数据（从 store，自动响应变化）
const tasks = computed(() => tasksStore.recentTasks);

// 获取笔记数据（从 store，自动响应变化）
const notes = computed(() => notesStore.recentNotes);

// 获取当前日期信息
const dateInfo = computed(() => {
  const now = new Date();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekDay = weekDays[now.getDay()];

  return {
    date: formatDate(now, "YYYY年MM月DD日"),
    weekDay: `星期${weekDay}`,
  };
});

// 获取励志文案（可以后续扩展为随机或API获取）
const motivationalText = computed(() => {
  return "每一个不曾起舞的日子，都是对生命的辜负。";
});

// ========== 新增操作处理 ==========
// 打开新增任务对话框
const handleCreateTask = () => {
  tasksStore.openCreateDialog();
};

// 打开新增笔记对话框
const handleCreateNote = () => {
  const newNote = {
    id: Date.now().toString(),
    title: "新笔记",
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notesStore.addNote(newNote);
  notesStore.selectNote(newNote.id);
  appStore.openNotesDialog();
};

const getTasksStatusStyle = (status) => {
  if (status === "pending") {
    return {
      "--task-color": "var(--color-warning)",
      "--task-color-rgb": "var(--color-warning-rgb)",
    };
  }
  if (status === "running") {
    return {
      "--task-color": "var(--color-info)",
      "--task-color-rgb": "var(--color-info-rgb)",
    };
  }
};

// 初始化 Home Store 数据
onMounted(() => {
  homeStore.init();
});
</script>

<template>
  <div class="home-panel size-full flex flex-col gap-5 overflow-auto p-5">
    <header class="home-panel-header flex-none flex items-center gap-8">
      <div class="date-info text-2xl font-bold text-[var(--color-info)]">
        {{ dateInfo.date }} {{ dateInfo.weekDay }}
      </div>
      <div class="motivational-text text-base text-[var(--text-secondary)]">
        {{ motivationalText }}
      </div>
    </header>

    <main class="home-panel-main flex-1 flex gap-4 min-h-0">
      <section class="recent-section flex flex-col gap-4 w-[420px] flex-none">
        <!-- 近期任务 -->
        <NCard class="home-card flex-1 min-h-0">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="text-sm font-medium">近期任务</div>
              <button
                class="add-btn p-1 rounded hover:bg-[var(--color-white-alpha-4)] transition-colors"
                @click="handleCreateTask"
                title="新建任务"
              >
                <IconAddTask class="add-btn-icon text-lg" />
              </button>
            </div>
          </template>
          <div v-if="tasks.length > 0" class="space-y-2">
            <TaskCard
              v-for="task in tasks"
              :key="task.id"
              :task="task"
              :type="task.status"
              :style="{ ...getTasksStatusStyle(task.status) }"
            />
          </div>
          <NEmpty v-else description="暂无任务" size="small" />
        </NCard>

        <!-- 近期笔记 -->
        <NCard class="home-card flex-1 min-h-0">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="text-sm font-medium">近期笔记</div>
              <button
                class="add-btn p-1 rounded hover:bg-[var(--color-white-alpha-4)] transition-colors"
                @click="handleCreateNote"
                title="新建笔记"
              >
                <IconAssignmentAdd class="add-btn-icon text-lg" />
              </button>
            </div>
          </template>
          <div v-if="notes.length > 0" class="space-y-2">
            <NoteCard
              v-for="note in notes"
              :key="note.id"
              :note="note"
              :is-active="false"
            />
          </div>
          <NEmpty v-else description="暂无笔记" size="small" />
        </NCard>
      </section>

      <section class="other-section h-full flex-1 min-w-0">
        <RecentSitesList />
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.home-panel-main {
  .home-card {
    border-color: var(--color-white-alpha-5);
  }
}
.recent-section {
  .add-btn {
    .add-btn-icon {
      color: rgba(var(--color-success-rgb), 0.7);
    }

    &:hover {
      .add-btn-icon {
        color: var(--color-success);
      }
    }
  }
}

.other-section {
}
</style>
