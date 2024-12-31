<script setup>
import { NForm, NFormItem, NInput, NButton } from "naive-ui";

const emit = defineEmits(["create"]);

// Form state
const formGroupRef = ref(null);
const formGroupModel = ref({
  groupName: "",
  stockCode: "",
});

const rules = {
  groupName: {
    required: true,
    trigger: ["input", "blur"],
    validator: (rule, value) => {
      const tmp = value.trim();
      if (!tmp) {
        return new Error("请输入分组名称");
      }
      const stockNameRegex = /^[\u4e00-\u9fa5A-Za-z0-9\s\-()（）]{2,50}$/;
      if (!stockNameRegex.test(tmp)) {
        return new Error("股票名称格式不正确");
      }
      return true;
    },
  },
  stockCode: {
    required: true,
    trigger: ["input", "blur"],
    validator: (rule, value) => {
      const tmp = value.trim();
      if (!tmp) {
        return new Error("请输入股票代码");
      }
      const stockCodeRegex = /^(sh|sz|bj|hk|us)?[A-Z0-9]{1,6}$/i;
      if (!stockCodeRegex.test(tmp)) {
        return new Error("股票代码格式不正确");
      }
      return true;
    },
  },
};

// 创建新分组
const handleCreateGroup = () => {
  formGroupRef.value?.validate((errors) => {
    if (errors) {
      emit("create", { data: null, isSuccess: false });
    } else {
      emit("create", { data: formGroupModel.value, isSuccess: true });
    }
  });
};
</script>

<template>
  <NForm
    class="flex gap-2"
    ref="formGroupRef"
    :model="formGroupModel"
    :rules="rules"
    size="small"
  >
    <NFormItem class="flex-1" label="分组名称" path="groupName">
      <NInput
        v-model:value="formGroupModel.groupName"
        placeholder="请输入分组名称"
      />
    </NFormItem>
    <NFormItem class="flex-1" label="股票代码" path="stockCode">
      <NInput
        v-model:value="formGroupModel.stockCode"
        placeholder="请输入股票代码"
      />
    </NFormItem>
    <NFormItem class="flex-none" label="">
      <NButton type="primary" @click="handleCreateGroup" size="small">
        新分组
      </NButton>
    </NFormItem>
  </NForm>
</template>
