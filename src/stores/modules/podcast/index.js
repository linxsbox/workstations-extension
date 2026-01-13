import { defineStore } from "pinia";
import { isString, isObject, hex2rgb } from "@linxs/toolkit";
import http from '@/utils/http';

export const storePodcast = defineStore({
  id: "StorePodcast",

  state: () => ({
    // GetPodcast.xyz 的缓存
    podcastXyzCache: [],
  }),

  getters: {
    getPodcastXyzCache: (state) => state.podcastXyzCache,
  },

  actions: {
    /**
     * 搜索小宇宙播客
     * @param {string} query - 搜索关键词
     * @param {AbortSignal} signal - 用于取消请求的信号
     * @returns {Promise<Array>} 播客列表
     */
    async searchXiaoyuzhouPodcasts(query, signal = null) {
      if (!query) return [];

      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        };

        // 如果提供了 signal，添加到选项中
        if (signal) {
          options.signal = signal;
        }

        const dataJson = await http.post(
          `https://ask.xiaoyuzhoufm.com/api/keyword/search`,
          { query },
          signal ? { signal } : {}
        );

        const podcasts = dataJson.data?.podcasts || [];

        return podcasts.map((item) => {
          const getImgSrc = () => {
            if (isString(item.image)) return item.image;
            return isObject(item.image) ? item.image.thumbnailUrl : "";
          };

          const getColor = () => {
            if (isObject(item.color) && item.color.original) {
              if (item.color.original.includes("#")) {
                const { r, g, b } = hex2rgb(item.color.original);
                return `${r},${g},${b}`;
              }
              return item.color.original;
            }
            if (isString(item.color)) {
              if (item.color.includes("#")) {
                const { r, g, b } = hex2rgb(item.color);
                return `${r},${g},${b}`;
              }
              return item.color;
            }
            return "";
          };

          return {
            id: item.pid,
            title: item.title || "",
            author: item.author || "",
            brief: item.brief || "",
            image: getImgSrc(),
            color: getColor(),
            link: `https://www.xiaoyuzhoufm.com/podcast/${item.pid}`,
          };
        });
      } catch (error) {
        // 忽略取消请求的错误
        if (error.name === "AbortError") {
          throw error; // 继续传播 AbortError
        }
        console.error("小宇宙搜索失败:", error);
        return [];
      }
    },

    /**
     * 确保 GetPodcast.xyz 缓存已加载
     * @param {AbortSignal} signal - 用于取消请求的信号
     */
    async ensureGetPodcastXyzCache(signal = null) {
      if (this.podcastXyzCache.length > 0) {
        return;
      }

      try {
        const options = signal ? { signal } : {};
        const html = await http.get(`https://getpodcast.xyz/`, options);

        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(html, "text/html");

        const cache = [];
        htmlDoc.querySelectorAll(".pic_list").forEach((list) => {
          list.querySelectorAll("li").forEach((liItem) => {
            if (liItem.childNodes.length > 0) {
              const titleEl = liItem.querySelector(".title");
              const imgEl = liItem.querySelector("img");
              const linkEl = liItem.querySelector("a");

              if (titleEl && imgEl && linkEl) {
                cache.push({
                  id: linkEl.href,
                  title: titleEl.textContent.trim(),
                  image: imgEl.src,
                  link: linkEl.href,
                  author: "",
                  brief: "",
                  color: "",
                });
              }
            }
          });
        });

        this.podcastXyzCache = cache;
      } catch (error) {
        // 忽略取消请求的错误
        if (error.name === "AbortError") {
          throw error;
        }
        console.error("GetPodcast.xyz 缓存加载失败:", error);
      }
    },

    /**
     * 搜索播客（并行搜索小宇宙和 GetPodcast.xyz）
     * @param {string} query - 搜索关键词
     * @param {AbortSignal} signal - 用于取消请求的信号
     * @returns {Promise<Array>} 播客列表
     */
    async searchPodcasts(query, signal = null) {
      if (!query) return [];

      try {
        // 并行搜索小宇宙和加载 GetPodcast.xyz 缓存
        const [xiaoyuzhouResults] = await Promise.allSettled([
          this.searchXiaoyuzhouPodcasts(query, signal),
          this.ensureGetPodcastXyzCache(signal),
        ]);

        // 检查请求是否被取消
        if (signal?.aborted) {
          return [];
        }

        // 合并结果
        const allResults = [];

        if (xiaoyuzhouResults.status === "fulfilled") {
          allResults.push(...xiaoyuzhouResults.value);
        }

        // 从缓存中搜索匹配项
        if (this.podcastXyzCache.length > 0) {
          const matches = this.podcastXyzCache.filter((item) =>
            item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())
          );
          allResults.push(...matches);
        }

        return allResults;
      } catch (error) {
        // 忽略取消请求的错误
        if (error.name === "AbortError") {
          throw error;
        }
        console.error("搜索失败:", error);
        throw error;
      }
    },

    /**
     * 清空 GetPodcast.xyz 缓存
     */
    clearPodcastXyzCache() {
      this.podcastXyzCache = [];
    },
  },
});
