/**
 * API Service
 * 统一的 API 请求服务层
 *
 * 将来可以在这里实现：
 * - 播客 API（小宇宙、GetPodcast）
 * - RSS 获取 API
 * - LLM API（DeepSeek 等）
 */

// API 客户端基类示例
export class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async get(url, options = {}) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "GET",
      ...options,
    });
    return response.json();
  }

  async post(url, data, options = {}) {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    return response.json();
  }
}

// 后续实现的 API 服务
// export { PodcastApi } from "./podcast.js";
// export { RssApi } from "./rss.js";
// export { LlmApi } from "./llm.js";
