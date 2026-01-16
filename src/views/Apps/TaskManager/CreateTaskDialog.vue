<script setup>
import { ref, computed, watch } from "vue";
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadioGroup,
  NRadio,
  NTimePicker,
  NCheckbox,
  NButton,
  useMessage,
  useNotification,
} from "naive-ui";
import { EXECUTION_RULE, TIME_LIMITS, NOTIFICATION_CONFIG, TEXT_LIMITS } from "./constants";

const props = defineProps({
  show: { type: Boolean, default: false },
  editingTaskId: { type: String, default: null },
  tasks: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:show", "create", "update"]);

const message = useMessage();
const notification = useNotification();
const formRef = ref(null);

// 计算属性
const minScheduledDelayMinutes = computed(() => TIME_LIMITS.MIN_SCHEDULED_DELAY / 60000);
const isEditMode = computed(() => !!props.editingTaskId);
const dialogTitle = computed(() => isEditMode.value ? "编辑任务" : "创建新任务");

// 表单数据
const formValue = ref({
  title: "",
  content: "",
  executionRule: EXECUTION_RULE.EXPECTED,
  expectedHours: 0,
  expectedMinutes: 0,
  scheduledTime: null,
  createAndStart: true,
});

// 监听编辑任务变化，填充表单数据
watch(() => props.editingTaskId, (taskId) => {
  if (taskId) {
    const task = props.tasks.find(t => t.id === taskId);
    if (task) {
      formValue.value.title = task.title;
      formValue.value.content = task.content || "";
      formValue.value.executionRule = task.executionRule;

      if (task.executionRule === EXECUTION_RULE.EXPECTED && task.expectedDuration) {
        formValue.value.expectedHours = Math.floor(task.expectedDuration / 60);
        formValue.value.expectedMinutes = task.expectedDuration % 60;
      } else {
        formValue.value.expectedHours = 0;
        formValue.value.expectedMinutes = 0;
      }

      formValue.value.scheduledTime = task.scheduledTime || null;
      formValue.value.createAndStart = false; // 编辑模式下默认不启动
    }
  }
});

// 表单验证规则
const rules = {
  title: [
    {
      required: true,
      message: "请输入任务标题",
      trigger: ["blur", "input"],
    },
    {
      max: TEXT_LIMITS.MAX_TITLE_LENGTH,
      message: `标题最多${TEXT_LIMITS.MAX_TITLE_LENGTH}个字`,
      trigger: ["blur", "input"],
    },
  ],
  content: [
    {
      max: TEXT_LIMITS.MAX_CONTENT_LENGTH,
      message: `内容最多${TEXT_LIMITS.MAX_CONTENT_LENGTH}个字`,
      trigger: ["blur", "input"],
    },
  ],
  expectedHours: [
    {
      type: "number",
      required: true,
      validator: (rule, value) => {
        if (formValue.value.executionRule !== EXECUTION_RULE.EXPECTED) {
          return true;
        }
        const totalMinutes = value * 60 + formValue.value.expectedMinutes;
        if (totalMinutes < TIME_LIMITS.MIN_EXPECTED_MINUTES) {
          return new Error(
            `预期时间至少为${TIME_LIMITS.MIN_EXPECTED_MINUTES}分钟`
          );
        }
        return true;
      },
      trigger: ["blur", "change"],
    },
  ],
  expectedMinutes: [
    {
      type: "number",
      required: true,
      validator: (rule, value) => {
        if (formValue.value.executionRule !== EXECUTION_RULE.EXPECTED) {
          return true;
        }
        const totalMinutes = formValue.value.expectedHours * 60 + value;
        if (totalMinutes < TIME_LIMITS.MIN_EXPECTED_MINUTES) {
          return new Error(
            `预期时间至少为${TIME_LIMITS.MIN_EXPECTED_MINUTES}分钟`
          );
        }
        return true;
      },
      trigger: ["blur", "change"],
    },
  ],
  scheduledTime: [
    {
      type: "number",
      required: true,
      validator: (rule, value) => {
        if (formValue.value.executionRule !== EXECUTION_RULE.SCHEDULED) {
          return true;
        }
        if (!value) {
          return new Error("请选择计划时间");
        }
        const diff = value - Date.now();
        if (diff <= TIME_LIMITS.MIN_SCHEDULED_DELAY) {
          return new Error(`计划时间必须比当前时间晚至少${minScheduledDelayMinutes.value}分钟`);
        }
        return true;
      },
      trigger: ["blur", "change"],
    },
  ],
};

// 创建/更新任务
const handleCreate = (e) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (errors) {
      return false;
    }

    const taskData = {
      title: formValue.value.title,
      content: formValue.value.content,
      executionRule: formValue.value.executionRule,
      createAndStart: formValue.value.createAndStart,
    };

    // 根据执行规则添加时间信息
    if (formValue.value.executionRule === EXECUTION_RULE.EXPECTED) {
      taskData.expectedDuration =
        formValue.value.expectedHours * 60 + formValue.value.expectedMinutes;
    } else {
      taskData.scheduledTime = formValue.value.scheduledTime;
    }

    // 根据模式触发不同的事件
    if (isEditMode.value) {
      emit("update", taskData);
    } else {
      emit("create", taskData);
    }
    resetForm();
    return true;
  });

  return false; // 阻止对话框立即关闭，等待验证结果
};

// 重置表单
const resetForm = () => {
  formValue.value = {
    title: "",
    content: "",
    executionRule: EXECUTION_RULE.EXPECTED,
    expectedHours: 0,
    expectedMinutes: 0,
    scheduledTime: null,
    createAndStart: true,
  };
  formRef.value?.restoreValidation();
};

// 关闭弹窗
const handleUpdateShow = (value) => {
  emit("update:show", value);
  if (!value) {
    resetForm();
  }
};

// 时间选择器禁用函数（禁用当前时间及之前）
const isTimeDisabled = (ts) => {
  return ts <= Date.now();
};

// 测试通知
const testNotification = () => {
  const title = "测试通知";
  const body = "这是一条测试通知消息，用于确认通知功能是否正常工作";

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

    message.success("测试通知已发送");
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

        message.success("测试通知已发送");
      } else {
        // 降级使用 Naive UI 通知
        notification.info({
          title,
          content: body,
          duration: NOTIFICATION_CONFIG.DURATION,
        });
        message.warning("浏览器通知权限被拒绝，已使用应用内通知");
      }
    });
  } else {
    // 降级使用 Naive UI 通知
    notification.info({
      title,
      content: body,
      duration: NOTIFICATION_CONFIG.DURATION,
    });
    message.info("浏览器不支持原生通知，已使用应用内通知");
  }
};
</script>

<template>
  <NModal
    :show="props.show"
    preset="dialog"
    :title="dialogTitle"
    :positive-text="isEditMode ? '保存' : '创建'"
    negative-text="取消"
    :style="{ width: '540px' }"
    @positive-click="handleCreate"
    @update:show="handleUpdateShow"
  >
    <NForm
      ref="formRef"
      :model="formValue"
      :rules="rules"
      label-placement="top"
    >
      <!-- 任务标题 -->
      <NFormItem label="任务标题" path="title">
        <NInput
          v-model:value="formValue.title"
          placeholder="请输入任务标题"
          :maxlength="TEXT_LIMITS.MAX_TITLE_LENGTH"
          show-count
          @keyup.enter="handleCreate"
        />
      </NFormItem>

      <!-- 任务内容 -->
      <NFormItem label="任务内容" path="content">
        <NInput
          v-model:value="formValue.content"
          type="textarea"
          placeholder="任务内容（可选）"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :maxlength="TEXT_LIMITS.MAX_CONTENT_LENGTH"
          show-count
        />
      </NFormItem>

      <!-- 执行规则 -->
      <NFormItem label="执行规则">
        <NRadioGroup v-model:value="formValue.executionRule">
          <div class="flex gap-4">
            <NRadio :value="EXECUTION_RULE.EXPECTED">预期时间</NRadio>
            <NRadio :value="EXECUTION_RULE.SCHEDULED">计划时间</NRadio>
          </div>
        </NRadioGroup>
      </NFormItem>

      <!-- 预期时间输入 -->
      <NFormItem
        v-if="formValue.executionRule === EXECUTION_RULE.EXPECTED"
        label="预期时间"
        :show-feedback="false"
      >
        <div class="flex gap-3 items-center w-full">
          <NFormItem path="expectedHours" :show-label="false">
            <div class="flex items-center gap-2">
              <NInputNumber
                v-model:value="formValue.expectedHours"
                :min="0"
                :max="TIME_LIMITS.MAX_EXPECTED_HOURS"
                :show-button="false"
                placeholder="小时"
                class="w-20"
              />
              <span class="text-sm">小时</span>
            </div>
          </NFormItem>
          <NFormItem path="expectedMinutes" :show-label="false">
            <div class="flex items-center gap-2">
              <NInputNumber
                v-model:value="formValue.expectedMinutes"
                :min="0"
                :max="TIME_LIMITS.MAX_EXPECTED_MINUTES"
                :show-button="false"
                placeholder="分钟"
                class="w-20"
              />
              <span class="text-sm">分钟</span>
              <span class="text-xs text-[var(--text-tertiary)]">
                （总时长至少 {{ TIME_LIMITS.MIN_EXPECTED_MINUTES }} 分钟）
              </span>
            </div>
          </NFormItem>
        </div>
      </NFormItem>

      <!-- 计划时间输入 -->
      <NFormItem
        v-if="formValue.executionRule === EXECUTION_RULE.SCHEDULED"
        label="计划时间"
        path="scheduledTime"
      >
        <div class="flex gap-3 items-center w-full">
          <NTimePicker
            v-model:value="formValue.scheduledTime"
            :is-time-disabled="isTimeDisabled"
            format="HH:mm"
            placeholder="选择计划执行时间"
            class="w-56"
          />
          <span class="text-xs text-[var(--text-tertiary)]">
            （必须比当前时间晚至少 {{ minScheduledDelayMinutes }} 分钟）
          </span>
        </div>
      </NFormItem>

      <!-- 创建并启动（仅在创建模式下显示） -->
      <NFormItem v-if="!isEditMode" :show-label="false">
        <NCheckbox v-model:checked="formValue.createAndStart">
          创建并启动
        </NCheckbox>
      </NFormItem>
    </NForm>

    <!-- 测试通知按钮 -->
    <template #action>
      <div class="flex justify-between w-full">
        <NButton quaternary size="small" @click="testNotification">
          测试通知
        </NButton>
        <div class="flex gap-2">
          <NButton @click="handleUpdateShow(false)">取消</NButton>
          <NButton type="primary" @click="handleCreate">创建</NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>
