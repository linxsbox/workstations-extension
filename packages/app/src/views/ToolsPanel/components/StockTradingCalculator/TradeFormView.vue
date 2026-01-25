<script setup>
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NRadioGroup,
  NRadioButton,
} from "naive-ui";
import { tradeTypeEnum } from "./config.js";

const props = defineProps({
  code: {
    type: String,
    default: "",
    required: true,
  },
});

const emit = defineEmits(["create"]);

// Form state
const formTradeRef = ref(null);
const formTradeModel = ref({
  tradeType: tradeTypeEnum.BUY, // default to buy
  volume: "100", // 交易数量
  price: "",
});

const rules = {
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
};

// Trade type options
const tradeTypeOptions = [
  { label: "买入", value: tradeTypeEnum.BUY },
  { label: "卖出", value: tradeTypeEnum.SELL },
];

// Calculation result state
const calculationResult = ref({
  totalAmount: "0.00",
  commission: "0.00",
});

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

// 新增指定分组的交易记录
const handleSubmitTrade = () => {
  if (!props.code) {
    emit("create", {
      data: null,
      isSuccess: false,
      message: "股票代码不能为空",
    });
    return;
  }

  formTradeRef.value?.validate((errors) => {
    if (errors) return;

    emit("create", {
      data: { ...formTradeModel.value },
      isSuccess: true,
      message: "",
    });

    formTradeModel.value.price = "";

    calculationResult.value = {
      totalAmount: "0.00",
      commission: "0.00",
    };

    nextTick(async () => {
      formTradeRef.value?.restoreValidation();

      if (!tabIndex1El || !tabIndex2El) return;

      formTradeModel.value.price = "";
      tabIndex1El.focus();
      tabIndex1El.select();
    });
  });
};

let tabIndex1El = null;
let tabIndex2El = null;
// 设置输入项 tabindex
const setInputFocusIndex = () => {
  tabIndex1El = document.querySelector(".tabindex-1 input");
  tabIndex2El = document.querySelector(".tabindex-2 input");

  if (!tabIndex1El) return;
  if (tabIndex1El.getAttribute("tabindex") === "1") return;

  tabIndex1El.setAttribute("tabindex", 1);
  tabIndex2El.setAttribute("tabindex", 2);
};

// 提交交易数量
const handleSubmitVolume = () => {
  tabIndex2El && tabIndex2El.focus();
};

// 通过数字键选择交易类型
const tradeType = ref(null);
const handleChioceTradeType = (e) => {
  e.preventDefault();

  const n1 = ["1", 49];
  const n2 = ["2", 50];
  let keyupNum = -1;
  if (n1.includes(e.key) || n1.includes(e.keyCode) || n1.includes(e.which)) {
    keyupNum = 0;
  } else if (
    n2.includes(e.key) ||
    n2.includes(e.keyCode) ||
    n2.includes(e.which)
  ) {
    keyupNum = 1;
  } else {
    return;
  }

  formTradeModel.value.tradeType = [tradeTypeEnum.BUY, tradeTypeEnum.SELL][
    keyupNum
  ];

  if (!tabIndex2El) return;
  formTradeModel.value.price = "";
  tabIndex2El.focus();
};

//
const handleFocusTradeType = (e) => {
  e.preventDefault();

  tradeType.value &&
    tradeType.value.selfElRef &&
    tradeType.value.selfElRef.focus();
};

onMounted(() => {
  setInputFocusIndex();
});
</script>

<template>
  <!-- 交易记录分组 -->
  <NForm
    ref="formTradeRef"
    class=""
    :model="formTradeModel"
    :rules="rules"
    size="small"
  >
    <div class="form-row flex gap-2">
      <NFormItem label="交易数量" path="volume">
        <NInput
          v-model:value="formTradeModel.volume"
          class="tabindex-1"
          placeholder=""
          @input="calculateTrade"
          @keyup.tab="handleFocusTradeType"
          @keyup.enter="handleSubmitVolume"
        />
      </NFormItem>

      <NFormItem label="交易价格" path="price">
        <NInput
          v-model:value="formTradeModel.price"
          class="tabindex-2"
          placeholder=""
          :precision="3"
          @input="calculateTrade"
          @keyup.tab="handleFocusTradeType"
          @keyup.enter="handleSubmitTrade"
        />
      </NFormItem>

      <NFormItem label="" class="flex-none">
        <NButton type="primary" @click="handleSubmitTrade" size="small">
          记一笔
        </NButton>
      </NFormItem>
    </div>

    <div class="form-row flex gap-2">
      <NFormItem label="交易类型" path="tradeType" :show-feedback="false">
        <NRadioGroup
          ref="tradeType"
          :class="['trade-type', formTradeModel.tradeType]"
          v-model:value="formTradeModel.tradeType"
          tabindex="3"
          @keyup="handleChioceTradeType"
        >
          <NRadioButton
            :class="`trade-type-${option.value} `"
            v-for="option in tradeTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </NRadioButton>
        </NRadioGroup>
      </NFormItem>

      <NFormItem label="" :show-feedback="false">
        <span>参考金额：{{ calculationResult.totalAmount }} 元</span>
      </NFormItem>
    </div>
  </NForm>
</template>

<style lang="scss" scoped>
.trade-type {
  --n-button-color: rgba(var(--trade-type-inverse-rgb), 0.25) !important;
  --n-button-color-active: rgba(var(--trade-type-rgb), 0.1) !important;
  --n-button-text-color-active: var(--trade-type-color) !important;
  --n-button-text-color-hover: var(--trade-type-inverse-color) !important;
  --n-button-border-color: var(--trade-type-inverse-color) !important;
  --n-button-border-color-active: var(--trade-type-color) !important;
  --n-button-box-shadow-focus: inset 0 0 0 1px var(--trade-type-color),
    0 0 0 2px rgba(var(--trade-type-rgb), 0.3) !important;

  &.BUY {
    --trade-type-color: var(--trade-type-buy-color);
    --trade-type-rgb: 61, 160, 44;
    --trade-type-inverse-color: var(--trade-type-sell-color);
    --trade-type-inverse-rgb: 240, 95, 90;

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
    --trade-type-rgb: 240, 95, 90;
    --trade-type-inverse-color: var(--trade-type-buy-color);
    --trade-type-inverse-rgb: 61, 160, 44;

    .trade-type-BUY {
      color: var(--trade-type-inverse-color);

      &:hover {
        background-color: rgba(var(--trade-type-inverse-rgb), 0.1);
        border-color: var(--trade-type-inverse-rgb);
      }
    }
  }
}
</style>
