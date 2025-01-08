import * as Vue from "vue";
import { loadModule } from "vue3-sfc-loader/dist/vue3-sfc-loader";
import { isArray } from "@linxs/toolkit";
import { importDataForGithub } from "@/utils";

export const toolsList = [
  {
    name: "股票交易计算器",
    icon: Vue.markRaw(
      defineAsyncComponent(() => import("@/components/Icons/IconCalculate.vue"))
    ),
    component: Vue.markRaw(
      defineAsyncComponent(() =>
        import("./components/StockTradingCalculator/CalculatorView.vue")
      )
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

// 加载动态组件 SFC
const loadModuleSFC = async (url = "", config = {}) => {
  const res = await importDataForGithub(url, false);
  if (res.isError) return res;

  // const options = {
  //   moduleCache: {
  //     vue: Vue,
  //     "@linxs/toolkit": await import("@linxs/toolkit"),
  //   },
  //   async getFile(url) {
  //     return res.message;
  //   },
  //   addStyle(textContent) {
  //     const style = Object.assign(document.createElement("style"), {
  //       textContent,
  //     });
  //     const ref = document.head.getElementsByTagName("style")[0] || null;
  //     document.head.insertBefore(style, ref);
  //   },
  // };

  // if (chrome && chrome.scripting) {
  //   const queryOptions = { active: true, currentWindow: true };
  //   const [tab] = await chrome.tabs.query(queryOptions);

  //   const a = chrome.scripting.executeScript({
  //     target: { tabId: tab.id },
  //     func: () => {},
  //   });
  //   console.log(a);
  // }

  const component = await safeLoadComponent(res.message)

  return {
    name: config.name || +new Date(),
    customize: true,
    icon: null,
    component: component
    // defineAsyncComponent(() =>
    //   loadModule(config.fileName || `${+new Date()}.vue`, options)
    // ),
  };
};


import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

async function safeLoadComponent(source) {
  try {
    const { descriptor } = parse(source)
    
    // 提取 script 和 template 内容
    const scriptContent = descriptor.script 
      ? descriptor.script.content 
      : descriptor.scriptSetup 
        ? descriptor.scriptSetup.content 
        : ''
    
    const templateContent = descriptor.template.content

    return defineAsyncComponent({
      loader: async () => {
        return defineComponent({
          template: templateContent,
          setup() {
            // 使用安全的方式处理响应式状态
            const setupContext = {}

            try {
              // 创建一个安全的执行上下文
              const executeInSandbox = (code, context) => {
                const keys = Object.keys(context)
                const values = keys.map(key => context[key])
                
                // 使用函数构造器创建一个安全的执行环境
                const fn = new Function(...keys, `
                  "use strict";
                  return (() => {
                    ${code}
                  })();
                `)
                
                return fn(...values)
              }

              // 执行 setup 逻辑
              const result = executeInSandbox(scriptContent, {
                ref,
                reactive,
                console: {
                  log: console.log,
                  error: console.error
                }
              })

              // 如果返回了对象，合并到 setupContext
              if (result && typeof result === 'object') {
                Object.assign(setupContext, result)
              }
            } catch (error) {
              console.error('Setup error', error)
            }

            return setupContext
          }
        })
      },
      loadingComponent: defineComponent({
        render() {
          return h('div', 'Loading...')
        }
      }),
      errorComponent: defineComponent({
        render() {
          return h('div', 'Error loading component')
        }
      })
    })
  } catch (error) {
    console.error('Component compilation error', error)
    return null
  }
}