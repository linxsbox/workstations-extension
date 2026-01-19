import { Amors } from '@linxs/amors';

/**
 * 创建一个基础的 HTTP 请求管理器
 * 用于公开 API 请求，不需要认证
 */
const http = new Amors({
  timeout: 30000,
  interceptors: {
    request: ({ config, context }) => {
      // context 包含: url, config, options, method
      // console.log('Request URL:', context.url);
      // console.log('Request method:', context.method);

      // 确保 headers 是 Headers 对象
      if (!config.headers) {
        config.headers = new Headers();
      } else if (!(config.headers instanceof Headers)) {
        // 如果不是 Headers 对象，转换为 Headers 对象
        const tempHeaders = new Headers();
        Object.entries(config.headers).forEach(([key, value]) => {
          tempHeaders.set(key, value);
        });
        config.headers = tempHeaders;
      }

      return config;
    },
    response: async ({ response, context }) => {
      // 检查响应头的 Content-Type
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (error) {
          console.error('JSON解析失败:', error);
          // 如果解析失败，返回原始响应
          data = response;
        }
      } else if (contentType && contentType.includes('text/')) {
        // 处理文本响应
        data = await response.text();
      } else {
        // 其他类型直接返回响应
        data = response;
      }

      // 检查HTTP状态码
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      // 如果请求需要服务器时间，返回包含时间的对象
      if (context.config && context.config.needServerTime) {
        const serverTime = response.headers.get('date');
        return {
          data,
          serverTime: serverTime ? new Date(serverTime).getTime() : Date.now()
        };
      }

      // 返回解析后的数据
      return data;
    },
  },
});

export default http;
