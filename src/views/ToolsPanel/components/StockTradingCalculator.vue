<script setup>
import {
  NForm,
  NFormItem,
  NInput,
  NRadioGroup,
  NRadioButton,
  NButton,
  NDivider,
  NScrollbar,
  NEmpty,
  useMessage,
} from "naive-ui";
import { StockGroupManager } from "@linxs/toolkit";

const message = useMessage();

// Initialize group manager
const groupManager = new StockGroupManager();
const TradeType = groupManager.TradeType;
// Form state
const formGroupRef = ref(null);
const formGroupModel = ref({
  groupName: "",
  stockCode: "",
});
const formTradeRef = ref(null);
const formTradeModel = ref({
  tradeType: TradeType.BUY, // default to buy
  volume: "100", // 交易数量
  price: "",
});

// Form validation rules
const rules = {
  group: {
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
  },
  trade: {
    volume: {
      required: true,
      validator(rule, value) {
        const tmp = Number(value.trim());
        if (!tmp) {
          return new Error("请输入交易数量");
        }
        if (tmp % 100 !== 0) {
          return new Error("必须是100的倍数");
        }
        return true;
      },
      trigger: ["input", "blur"],
    },
    price: {
      required: true,
      trigger: ["input", "blur"],
      validator: (rule, value) => {
        const tmp = value.trim();
        if (!tmp) {
          return new Error("请输入交易价格");
        }
        const stockPriceRegex = /^(([1-9]\d*(\.\d{1,3})?)|0(\.\d{1,3})?|0)$/;
        if (!stockPriceRegex.test(value)) {
          return new Error("股票价格格式不正确");
        }
        // 额外的数值范围验证
        const numValue = parseFloat(value);
        if (numValue <= 0 || numValue > 1000000) {
          return new Error("股票价格必须在0-1000000之间");
        }
        return true;
      },
    },
  },
};

// Calculation result state
const calculationResult = ref({
  totalAmount: "0.00",
  commission: "0.00",
});

// Trade type options
const tradeTypeOptions = [
  { label: "买入", value: TradeType.BUY },
  { label: "卖出", value: TradeType.SELL },
];

// Calculate trade details
const calculateTrade = () => {
  if (!formTradeModel.value.price || !formTradeModel.value.volume) return;

  const totalAmount = formTradeModel.value.price * formTradeModel.value.volume;
  const commission = Math.max(totalAmount * 0.001, 5); // 0.1% commission, minimum 5 yuan

  calculationResult.value = {
    totalAmount: totalAmount.toFixed(2),
    commission: commission.toFixed(2),
  };
};

const groupList = ref([]);
const currentTradeHistory = ref([]);
onMounted(() => {
  updateGroupList();
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
  const lastTrade = trades[0];
  return {
    isBuy: lastTrade.type === TradeType.BUY,
    type: lastTrade.type === TradeType.BUY ? "买" : "卖",
    price: lastTrade.price,
  };
};

// 创建新分组
const hdandleCreateGroup = () => {
  formGroupRef.value?.validate((errors) => {
    if (errors) return;

    formGroupRef.value?.validate((errors) => {
      if (errors) return;
    });
    const group = groupManager.getGroupByCode(formGroupModel.value.stockCode);
    if (group) return message.warning("股票分组已存在");

    const success = groupManager.createGroup(
      formGroupModel.value.groupName,
      formGroupModel.value.stockCode
    );
    if (!success) return message.error("股票分组创建失败");

    message.success("股票分组创建成功");
    updateGroupList();
  });
};

// 新增指定分组的交易记录
const handleSubmitTrade = () => {
  formTradeRef.value?.validate((errors) => {
    if (errors) return;

    const stockCode = formGroupModel.value.stockCode;

    if (!stockCode) {
      return message.error("股票代码不能为空");
    }

    const group = groupManager.getGroupByCode(formGroupModel.value.stockCode);
    if (!group) {
      return message.error("股票分组不存在");
    }

    let success = groupManager.addTrade(stockCode, {
      type: formTradeModel.value.tradeType,
      price: formTradeModel.value.price,
      volume: formTradeModel.value.volume,
    });

    if (!success) {
      return message.error("添加交易失败");
    }

    updateCurrentTradeHistory(stockCode);

    updateGroupList();

    formTradeRef.value?.restoreValidation();
    formTradeModel.value.price = "";
    calculationResult.value = {
      totalAmount: "0.00",
      commission: "0.00",
    };
  });
};

// 切换当前分组
const handleSwitchGroup = (group) => {
  groupList.value.find;
  formGroupRef.value?.restoreValidation();
  formGroupModel.value.groupName = group.name;
  formGroupModel.value.stockCode = group.code;

  updateCurrentTradeHistory(group.code);
};

const handleDeleteGroup = (stockCode) => { };
</script>

<template>
  <div class="stock-trading-calculator flex w-full h-full gap-2">
    <div class="flex flex-col justify-between gap-2 w-[65%] h-full overflow-hidden">
      <!-- 表单 -->
      <div class="form-group flex flex-col">
        <!-- 股票分组 -->
        <NForm class="flex gap-2 justify-between" ref="formGroupRef" :model="formGroupModel" :rules="rules.group"
          size="small">
          <NFormItem label="分组名称" path="groupName">
            <NInput v-model:value="formGroupModel.groupName" placeholder="请输入分组名称" />
          </NFormItem>
          <NFormItem label="股票代码" path="stockCode">
            <NInput v-model:value="formGroupModel.stockCode" placeholder="请输入股票代码" />
          </NFormItem>
          <NFormItem label="" class="flex-none">
            <NButton type="primary" @click="hdandleCreateGroup" size="small">新分组</NButton>
          </NFormItem>
        </NForm>

        <!-- 交易记录分组 -->
        <NForm ref="formTradeRef" :model="formTradeModel" :rules="rules.trade" size="small">
          <div class="form-row flex justify-between gap-2">
            <NFormItem label="交易数量" path="volume">
              <NInput v-model:value="formTradeModel.volume" placeholder="" @input="calculateTrade" />
            </NFormItem>

            <NFormItem label="交易价格" path="price">
              <NInput v-model:value="formTradeModel.price" :precision="3" placeholder="" @input="calculateTrade" />
            </NFormItem>

            <NFormItem label="" class="flex-none">
              <NButton type="primary" @click="handleSubmitTrade" size="small">
                记一笔
              </NButton>
            </NFormItem>
          </div>

          <div class="form-row flex justify-between gap-2">
            <NFormItem label="交易类型" path="tradeType" :show-feedback="false">
              <NRadioGroup :class="['trade-type', formTradeModel.tradeType]" v-model:value="formTradeModel.tradeType">
                <NRadioButton :class="`trade-type-${option.value}`" v-for="option in tradeTypeOptions" :key="option.value"
                  :value="option.value">
                  {{ option.label }}
                </NRadioButton>
              </NRadioGroup>
            </NFormItem>

            <NFormItem label="" :show-feedback="false">
              <span>参考金额：{{ calculationResult.totalAmount }} 元</span>
            </NFormItem>
          </div>
        </NForm>

        <NDivider class="row-divider" />
      </div>

      <div class="group-list-container flex-1 flex flex-col overflow-hidden">
        <h2 class="pb-3 text-xl font-bold flex-none">分组列表</h2>
        <!-- 股票分组列表 -->
        <NScrollbar class="group-list flex-1" content-class="flex flex-wrap gap-2">
          <section class="group-item w-[180px] h-[130px] p-2 rounded-md cursor-pointer" v-for="group in groupList"
            :key="group.timestamp" @click="handleSwitchGroup(group)">
            <h3>{{ group.name }}（{{ group.code }}）</h3>
            <div>持仓：{{ group.result.totalAmount }}</div>
            <div>市值：{{ group.result.totalVolume }}</div>
            <div>加权平均价：{{ group.result.averagePrice }}</div>
            <div>
              最后一笔：
              <div class="inline-flex gap-1 justify-center items-center" v-if="group.trades.length">
                <span :class="getLastTradeInfo(group.trades).isBuy
                  ? 'text-[var(--trade-type-buy-color)]'
                  : 'text-[var(--trade-type-sell-color)]'
                  ">
                  [{{ getLastTradeInfo(group.trades).type }}]
                </span>
                <span>{{ getLastTradeInfo(group.trades).price }}</span>
              </div>
              <template v-else>-</template>
            </div>
          </section>
          <template v-if="!groupList.length">
            <NEmpty class="mx-auto pt-10" description="暂无分组记录" />
          </template>
        </NScrollbar>
      </div>
    </div>

    <NDivider class="vertical-divider" vertical />

    <!-- 交易历史列表 -->
    <div class="trade-history-container flex-1 flex flex-col min-w-[150px] max-w-[180px]">
      <div>
        <h2 class="pb-3 text-xl font-bold">交易历史</h2>
      </div>
      <NScrollbar class="trade-list">
        <section class="trade-item p-2" v-for="trade in currentTradeHistory">
          <div>交易方向：{{ trade.direction }}</div>
          <div>成交价格：{{ trade.price }}</div>
          <div>成交数量：{{ trade.volume }}</div>
          <div>成交金额：{{ trade.amount }}</div>
        </section>
        <template v-if="!currentTradeHistory.length">
          <NEmpty class="pt-10" description="暂无历史" />
        </template>
      </NScrollbar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stock-trading-calculator {
  --trade-type-buy-color: #f05f5a;
  --trade-type-sell-color: #3da02c;

  .group-list {
    .group-item {
      border: 1px solid var(--border-color);

      &:hover {
        border-color: var(--state-hover);
      }
    }
  }
}

.trade-type {
  --n-button-color-active: rgba(var(--trade-type-rgb), 0.1) !important;
  --n-button-text-color-active: var(--trade-type-color) !important;
  --n-button-text-color-hover: var(--trade-type-inverse-color) !important;
  --n-button-border-color-active: var(--trade-type-color) !important;
  --n-button-box-shadow-focus: inset 0 0 0 1px var(--trade-type-color),
    0 0 0 2px rgba(var(--trade-type-rgb), 0.3) !important;

  &.BUY {
    --trade-type-color: var(--trade-type-buy-color);
    --trade-type-rgb: 240, 95, 90;
    --trade-type-inverse-color: var(--trade-type-sell-color);
    --trade-type-inverse-rgb: 61, 160, 44;

    .trade-type-SELL {
      color: var(--trade-type-inverse-color);

      &:hover {
        background-color: rgba(var(--trade-type-inverse-rgb), 0.1);
        border-color: var(--trade-type-inverse-rgb);
      }
    }
  }

  &.SELL {
    --trade-type-color: var(--trade-type-sell-color);
    --trade-type-rgb: 61, 160, 44;
    --trade-type-inverse-color: var(--trade-type-buy-color);
    --trade-type-inverse-rgb: 240, 95, 90;

    .trade-type-BUY {
      color: var(--trade-type-inverse-color);

      &:hover {
        background-color: rgba(var(--trade-type-inverse-rgb), 0.1);
        border-color: var(--trade-type-inverse-rgb);
      }
    }
  }
}

.trade-item {
  border-top: 1px solid var(--border-color);
}

.row-divider {
  margin: 14px 0;
}

.vertical-divider {
  height: 100%;
}
</style>
