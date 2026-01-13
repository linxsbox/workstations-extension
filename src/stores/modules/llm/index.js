import { defineStore } from "pinia";
import { isFunction, defaultStorage } from "@linxs/toolkit";
import http from '@/utils/http';

const { localStorage } = defaultStorage();

export const storeLLM = defineStore({
  id: "StoreLLM",

  state: () => ({
    // 当前使用的模型
    currentModel: "deepseek-chat",
    // API 配置
    apiConfigs: {
      deepseek: {
        baseUrl: "https://api.deepseek.com",
        chatEndpoint: "/chat/completions",
        model: "deepseek-chat",
      },
      // 可以在这里添加其他模型的配置
    },
  }),

  getters: {
    getCurrentModel: (state) => state.currentModel,
    getApiConfig: (state) => (provider) => state.apiConfigs[provider],
  },

  actions: {
    /**
     * 设置当前模型
     * @param {string} model - 模型名称
     */
    setCurrentModel(model) {
      this.currentModel = model;
    },

    /**
     * 获取 API Key
     * @param {string} provider - 服务提供商名称
     * @returns {string} API Key
     */
    getApiKey(provider) {
      const apiKeys = localStorage.get("APIKEYS") || {};

      // 根据不同的 provider 返回对应的 API Key
      switch (provider) {
        case "deepseek":
          return apiKeys.DeepSeekAPIKey;
        default:
          return null;
      }
    },

    /**
     * 调用 DeepSeek Chat API
     * @param {Object} options - 选项
     * @param {Array} options.messages - 消息列表
     * @param {string} options.model - 模型名称（可选，默认使用 state 中的 currentModel）
     * @param {boolean} options.stream - 是否启用流式响应（可选，默认 false）
     * @param {AbortSignal} options.signal - 用于取消请求的信号（可选）
     * @returns {Promise<Object>} API 响应
     */
    async callDeepSeekChat(options = {}) {
      const {
        messages,
        model = this.apiConfigs.deepseek.model,
        stream = false,
        signal = null,
      } = options;

      if (!messages || !Array.isArray(messages)) {
        throw new Error("messages 参数是必需的，且必须是数组");
      }

      const apiKey = this.getApiKey("deepseek");
      if (!apiKey) {
        throw new Error("未找到 DeepSeek API Key，请先配置");
      }

      try {
        const config = this.apiConfigs.deepseek;
        const url = `${config.baseUrl}${config.chatEndpoint}`;

        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            stream,
          }),
        };

        // 如果提供了 signal，添加到选项中
        if (signal) {
          requestOptions.signal = signal;
        }

        const response = await http.post(url, {
          model,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          stream,
        }, signal ? { signal } : {});

        return response;
      } catch (error) {
        console.error("DeepSeek API 调用失败:", error);
        throw error;
      }
    },

    /**
     * 创建聊天完成请求（带回调的版本，兼容旧的 config.js API）
     * @param {Object} options - 选项
     * @param {Function} options.before - 请求前回调
     * @param {Function} options.beforeDone - 响应处理前回调
     * @param {Function} options.after - 请求后回调
     * @returns {Function} 执行函数
     */
    createChatCompletion(options = {}) {
      const { before, beforeDone, after } = options;

      return async (opts = {}) => {
        const { isInit, done, onError, msgs } = opts;

        let messages = msgs;

        // 如果是初始化，使用默认的系统消息
        if (isInit && !messages) {
          messages = [{ role: "system", content: "你是一个有用的助手。" }];
        }

        // 调用 before 回调
        if (isFunction(before)) {
          before();
        }

        try {
          const response = await this.callDeepSeekChat({
            messages,
            stream: false,
          });

          // 调用 beforeDone 回调
          if (isFunction(beforeDone)) {
            beforeDone(response);
          }

          // 调用 done 回调
          if (isFunction(done)) {
            done(response);
          }

          return response;
        } catch (error) {
          // 调用 onError 回调
          if (isFunction(onError)) {
            onError(error);
          }
          throw error;
        } finally {
          // 调用 after 回调
          if (isFunction(after)) {
            after();
          }
        }
      };
    },

    /**
     * 添加新的模型配置
     * @param {string} name - 模型名称
     * @param {Object} config - 模型配置
     */
    addModelConfig(name, config) {
      this.apiConfigs[name] = config;
    },
  },
});
