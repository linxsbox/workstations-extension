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
import motivationalTexts from "./motivationalTexts.json";

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

/**
 * 根据日期生成伪随机数种子
 * @param {Date} date - 日期对象
 * @returns {number} 随机种子
 */
const getDateSeed = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
};

/**
 * 基于种子的伪随机数生成器
 * @param {number} seed - 随机种子
 * @returns {number} 0-1之间的随机数
 */
const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

/**
 * 从数组中随机选择n个不重复的元素
 * @param {Array} array - 源数组
 * @param {number} count - 选择数量
 * @param {number} seed - 随机种子
 * @returns {Array} 选中的元素数组
 */
const randomSelectFromArray = (array, count, seed) => {
  const selected = [];
  const indices = [...Array(array.length).keys()];

  for (let i = 0; i < count && indices.length > 0; i++) {
    const randomIndex = Math.floor(seededRandom(seed + i) * indices.length);
    const selectedIndex = indices[randomIndex];
    selected.push(array[selectedIndex]);
    indices.splice(randomIndex, 1);
  }

  return selected;
};

/**
 * 获取当前时间段应该显示的励志文案
 */
const motivationalText = computed(() => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour + minute / 60;

  // 22:00～07:00 (22时～次日7时)：休息提示
  if (currentTime >= 22 || currentTime < 7) {
    return "🌙 该休息了，早睡早起身体好";
  }

  // 12:00～13:00：午休提示
  if (currentTime >= 12 && currentTime < 13) {
    return "😴 午休时间，小憩一会儿吧";
  }

  // 获取今天的随机4句文案
  const seed = getDateSeed(now);
  const todayTexts = randomSelectFromArray(motivationalTexts.texts, 4, seed);

  // 根据时间段返回对应的文案
  // 07:00～09:30：第1句
  if (currentTime >= 7 && currentTime < 9.5) {
    return todayTexts[0];
  }

  // 09:30～12:00：第2句
  if (currentTime >= 9.5 && currentTime < 12) {
    return todayTexts[1];
  }

  // 13:00～17:30：第3句
  if (currentTime >= 13 && currentTime < 17.5) {
    return todayTexts[2];
  }

  // 17:30～22:00：第4句
  if (currentTime >= 17.5 && currentTime < 22) {
    return todayTexts[3];
  }

  // 默认返回第一句（兜底）
  return todayTexts[0];
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
