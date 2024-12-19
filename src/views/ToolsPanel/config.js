import { markRaw } from "vue";

export const toolsList = [
  {
    name: "股票交易计算器",
    icon: markRaw(
      defineAsyncComponent(() => import("@/components/Icons/IconCalculate.vue"))
    ),
    component: markRaw(
      defineAsyncComponent(() =>
        import("./components/StockTradingCalculator.vue")
      )
    ),
  },
];
