<script setup>
import {
  NInput,
  NButton,
  NDivider,
  NScrollbar,
  NEmpty,
  NPopconfirm,
  useMessage,
} from "naive-ui";
import { StockGroupManager, defaultStorage } from "@linxs/toolkit";
import DataImportExport from "@/components/widgets/DataImportExport/DataImportExport.vue";
import IconRefresh from "@/components/common/Icons/IconRefresh.vue";
import IconRedo from "@/components/common/Icons/IconRedo.vue";
import { importDataForGithub } from "@/utils/github";
import GroupFormView from "./GroupFormView.vue";
import GroupItemView from "./GroupItemView.vue";
import TradeFormView from "./TradeFormView.vue";

import { tradeTypeToValue } from "./config";

const { localStorage } = defaultStorage();

const message = useMessage();

// Initialize group manager
const groupManager = new StockGroupManager();

// 当前分组
const currentGroup = ref({
  groupName: "",
  stockCode: "",
});
const groupList = ref([]); // 分组列表
const currentTradeHistory = ref([]); // 当前交易历史
const groupUsages = ref([]); // 记录交易习惯
const activeTradeItem = ref(-1); // 当前选中的交易记录
const isGroupRefreshing = ref(false);

const GROUP_USAGE_KEY = "GROUP_USAGE";
onMounted(() => {
  updateGroupList();
  const groupUsage = localStorage.get(GROUP_USAGE_KEY);
  if (groupUsage) {
    groupUsages.value = groupUsage;
  }
});

// 更新分组列表
const updateGroupList = () => {
  groupList.value = groupManager.getAllGroups();
};
// 更新当前交易历史
const updateCurrentTradeHistory = (stockCode) => {
  const group = groupManager.getGroupByCode(stockCode);
  if (group) {
    currentTradeHistory.value = group.trades || [];
  }
};

// 获取最后一笔交易
const getLastTradeInfo = (trades) => {
  if (trades.length === 0) return { type: "", price: "" };
  return trades[0];
};

// 创建新分组
const handleCreateGroup = (result) => {
  if (!result.isSuccess) return;

  const data = result.data;

  const group = groupManager.getGroupByCode(data.stockCode);
  if (group) return message.warning("股票分组已存在");

  const success = groupManager.createGroup(data.groupName, data.stockCode);
  if (!success) return message.error("股票分组创建失败");

  message.success("股票分组创建成功");
  updateGroupList();
};

// 切换当前分组
const handleSelectedGroup = (group) => {
  currentGroup.value = {
    groupName: group.name,
    stockCode: group.code,
  };
  updateCurrentTradeHistory(group.code);
};

// 删除选中的分组
const handleDeleteGroup = (stockCode) => {
  groupManager.deleteGroupByCode(stockCode);
  updateGroupList();
  currentTradeHistory.value = [];
};

const handleChangeStockCode = (stockCode) => {
  currentGroup.value.stockCode = stockCode;
};
const handleBlurStockCode = (stockCode) => {
  currentGroup.value.stockCode = stockCode;
};

// 刷新分组
const handleRefreshGroups = () => {
  if (isGroupRefreshing.value) return;
  isGroupRefreshing.value = true;

  groupManager.updateGroupByCode();

  setTimeout(() => {
    isGroupRefreshing.value = false;
  }, 1000);
};

// 新增指定分组的交易记录
const handleSubmitTrade = (result) => {
  if (!result.isSuccess) {
    result.message && message.error(result.message);
    return;
  }

  if (!currentGroup.value.stockCode) {
    return message.error("股票代码不能为空");
  }

  const data = result.data;

  const group = groupManager.getGroupByCode(currentGroup.value.stockCode);
  if (!group) {
    return message.error("股票分组不存在");
  }

  let success = groupManager.addTrade(currentGroup.value.stockCode, {
    type: data.tradeType,
    price: data.price,
    volume: data.volume,
  });

  if (!success) {
    return message.error("添加交易失败");
  }

  updateCurrentTradeHistory(currentGroup.value.stockCode);

  updateGroupList();
};

// 撤销此笔交易
const handleRevokeTradeItem = (index) => {
  const tradeItem = currentTradeHistory.value[index];
  groupManager.deleteTrade(currentGroup.value.stockCode, tradeItem);

  updateGroupList();
  updateCurrentTradeHistory(currentGroup.value.stockCode);
};

// 显示导入对话框
const showImportDialog = ref(false);
const isImporting = ref(false);
const importUrl = ref("");
const isImportType = ref(0); // 0 导出 | 1 导入
const exportJson = ref("");
// 打开导入对话框
const handleShowImportDialog = (type) => {
  isImportType.value = type;
  showImportDialog.value = true;

  if (type === 0) {
    if (groupManager.getAllGroups().length > 0) {
      exportJson.value = JSON.stringify(groupManager.getAllGroups(), null, 2);
    } else {
      exportJson.value = "";
    }
  }
};

// 触发导入
const handleImport = async () => {
  isImporting.value = true;

  try {
    const res = await importDataForGithub(importUrl.value);

    if (res.isError) {
      return message.error(res.message || "数据导入失败");
    }

    groupManager.storage.importGroups(res.message);
    showImportDialog.value = false;
    message.success("数据导入成功");
    updateGroupList();
  } catch (error) {
    console.error("数据导入失败:", error);
    message.error("数据导入失败，请检查链接或数据格式问题");
  } finally {
    isImporting.value = false;
  }
};
</script>

<template>
  <div class="stock-trading-calculator flex w-full h-full gap-2">
    <div
      class="flex flex-col flex-1 justify-between gap-2 min-w-[65%] h-full overflow-hidden"
    >
      <!-- 表单 -->
      <div class="form-group flex">
        <section class="form-group flex-none flex flex-col">
          <!-- 股票分组 -->
          <GroupFormView
            :group="currentGroup"
            @create="handleCreateGroup"
            @change="handleChangeStockCode"
            @blur="handleBlurStockCode"
          />

          <!-- 添加交易记录 -->
          <TradeFormView
            :code="currentGroup.stockCode"
            @create="handleSubmitTrade"
          />
        </section>

        <!-- <NDivider class="vertical-divider" vertical /> -->

        <!-- <section class="flex-1 min-w-[100px]">
          <h3>交易习惯</h3>
        </section> -->
      </div>

      <NDivider class="row-divider" />

      <!-- 股票分组列表 -->
      <div class="group-list-container flex-1 flex flex-col overflow-hidden">
        <h2
          class="flex justify-between items-center pb-3 text-xl font-bold flex-none"
        >
          <div class="group-list-title flex items-center gap-2">
            <span>分组列表</span>
            <IconRefresh
              :class="[
                'icon-refresh cursor-pointer',
                { 'is-refresh': isGroupRefreshing },
              ]"
              @click="handleRefreshGroups"
            />
          </div>
          <div class="inline-flex items-center gap-2 text-sm">
            <NButton
              type="primary"
              size="small"
              tertiary
              @click="handleShowImportDialog(0)"
            >
              导出
            </NButton>
            <NButton
              type="primary"
              size="small"
              tertiary
              @click="handleShowImportDialog(1)"
            >
              导入
            </NButton>
          </div>
        </h2>
        <NScrollbar
          class="group-list flex-1"
          content-class="flex flex-wrap gap-2"
        >
          <template v-for="group in groupList" :key="group.timestamp">
            <GroupItemView
              :group="group"
              :lastTrade="getLastTradeInfo(group.trades)"
              @select="handleSelectedGroup"
              @delete="handleDeleteGroup"
            />
          </template>
          <template v-if="!groupList.length">
            <NEmpty class="mx-auto pt-10" description="暂无分组记录" />
          </template>
        </NScrollbar>
      </div>
    </div>

    <NDivider class="vertical-divider" vertical />

    <!-- 交易历史列表 -->
    <div class="trade-history-container flex-none flex flex-col w-[180px]">
      <div>
        <h2 class="pb-3 text-xl font-bold">交易历史</h2>
      </div>
      <NScrollbar class="trade-list" content-class="flex flex-col gap-2">
        <template v-for="(trade, index) in currentTradeHistory">
          <div
            class="w-full h-[1px] bg-[var(--border-color)]"
            v-if="index !== 0"
          ></div>
          <section
            class="trade-item p-2 rounded-md"
            :class="{ active: index === activeTradeItem }"
            @click="activeTradeItem = index"
          >
            <div class="flex justify-between items-center">
              <span :class="tradeTypeToValue(trade.type, true)">
                [{{ tradeTypeToValue(trade.type) }}]
              </span>
              <NPopconfirm
                positive-text="撤销"
                negative-text="取消"
                @positive-click.stop="handleRevokeTradeItem(index)"
              >
                撤销此笔交易
                <template #trigger>
                  <IconRedo
                    class="revoke text-base cursor-pointer rotate-y-180"
                  />
                </template>
              </NPopconfirm>
            </div>
            <div>成交价格：{{ trade.price }}</div>
            <div>成交数量：{{ trade.volume }}</div>
            <div>成交金额：{{ trade.amount }}</div>
          </section>
        </template>

        <template v-if="!currentTradeHistory.length">
          <NEmpty class="pt-10 mx-auto" description="暂无历史" />
        </template>
      </NScrollbar>
    </div>
  </div>

  <DataImportExport
    v-model:show="showImportDialog"
    :title="`导${['出', '入'][isImportType]}分组数据`"
    :import-type="isImportType"
    :export-data="exportJson"
    :loading="isImporting"
    @import="handleImport"
  >
    <template #import>
      <div class="mb-2">仅支持从 Github 导入</div>
      <NInput
        v-model:value="importUrl"
        :disabled="isImporting"
        placeholder="请输入 Github 地址"
      />
    </template>

    <template #export>
      <span>复制到 github 仓库使用 .json 文件保存</span>
    </template>
  </DataImportExport>
</template>

<style lang="scss" scoped>
.stock-trading-calculator {
  --trade-type-buy-color: #3da02c;
  --trade-type-sell-color: #f05f5a;
}

.group-list-title {
  .icon-refresh {
    &.is-refresh {
      animation: rotateRefreshing 1s linear;
    }

    @keyframes rotateRefreshing {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  }
}

.trade-item {
  border: 1px solid transparent;

  &:hover {
    background-color: var(--interactive-bg-hover);
    .revoke {
      opacity: 1;
    }
  }
  &.active {
    background-color: var(--interactive-bg-hover-1);
    border-color: var(--interactive-bg-active-1);
  }

  .revoke {
    opacity: 0;
    transition: opacity 0.35s linear;
  }
}

.row-divider {
  margin: 14px 0;
}

.vertical-divider {
  height: 100%;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
