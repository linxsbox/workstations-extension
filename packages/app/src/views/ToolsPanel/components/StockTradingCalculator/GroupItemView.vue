<script setup>
import { NPopconfirm } from "naive-ui";
import IconDelete from "@/components/common/Icons/IconDelete.vue";
import { tradeTypeToValue } from "./config.js";

const props = defineProps({
  group: {
    type: Object,
    default: () => {},
    required: true,
  },
  lastTrade: {
    type: Object,
    default: () => {},
    required: true,
  },
});

const emit = defineEmits(["select", "delete"]);

const handleSelected = (group) => emit("select", group);
const handleDeleteGroup = (event) => {
  event.stopPropagation(); // 阻止事件冒泡
  emit("delete", props.group.code);
};
</script>

<template>
  <section
    class="group-item relative w-[200px] h-[130px] p-2 rounded-md cursor-pointer"
    @click.stop="handleSelected(props.group)"
  >
    <NPopconfirm
      positive-text="删除"
      negative-text="取消"
      @positive-click.stop="handleDeleteGroup"
    >
      删除此分组？
      <template #trigger>
        <IconDelete
          @click.stop="() => {}"
          class="icon-delete absolute top-2 right-2 text-base cursor-pointer"
        />
      </template>
    </NPopconfirm>

    <h3>{{ props.group.name }}（{{ props.group.code }}）</h3>
    <div>持仓：{{ props.group.result.totalVolume }}</div>
    <div>市值：{{ props.group.result.totalAmount }}</div>
    <div>加权平均价：{{ props.group.result.averagePrice }}</div>
    <div>
      最后一笔：
      <div
        class="inline-flex gap-1 justify-center items-center"
        v-if="lastTrade"
      >
        <span :class="tradeTypeToValue(props.lastTrade.type, true)">
          [{{ tradeTypeToValue(props.lastTrade.type) }}]
        </span>
        <span>{{ props.lastTrade.price }}</span>
      </div>
      <template v-else>-</template>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.group-item {
  border: 1px solid var(--border-color);

  &:hover {
    border-color: var(--state-hover);
  }
}

.icon-delete {
  color: var(--color-bg-error-hover);

  &:hover {
    color: var(--color-error);
  }
}
</style>
