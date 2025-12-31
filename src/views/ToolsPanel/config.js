import { isArray } from "@linxs/toolkit";
import { importDataForGithub } from "@/utils";

export const toolsList = [
  {
    name: "股票交易计算器",
    icon: markRaw(
      defineAsyncComponent(() => import("@/components/common/Icons/IconCalculate.vue"))
    ),
    component: markRaw(
      defineAsyncComponent(() =>
        import("./components/StockTradingCalculator/CalculatorView.vue")
      )
    ),
  },

  {
    name: "神奇海螺",
    icon: markRaw(
      defineAsyncComponent(() => import("@/components/common/Icons/IconSentimentVerySatisfied.vue"))
    ),
    component: markRaw(
      defineAsyncComponent(() => import("./components/ChatLLM/WebChatView.vue"))
    ),
  },
];

// 加载 github 配置，动态构建自定义组件
export const loadGithubToolsCfg = async (toolsConfigUrl = "") => {
  const res = await importDataForGithub(toolsConfigUrl);
  if (res.isError) return res;

  const cfg = JSON.parse(res.message);

  const basePath = `${cfg.basePath}/${cfg.componentPath}`;
  const requeseList = [];

  (isArray(cfg.tools) ? cfg.tools : []).forEach((item) => {
    if (item.name && item.fileName) {
      requeseList.push({ url: `${basePath}/${item.fileName}`, config: item });
    }
  });

  const result = await Promise.allSettled(
    requeseList.map(async (item) => await loadModuleSFC(item.url, item.config))
  );

  const componentList = result
    .filter((item) => {
      return item.status === "fulfilled" && item.value;
    })
    .map((item) => item.value);

  return { isError: false, data: componentList };
};
