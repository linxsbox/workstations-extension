import { ref, watch, computed } from 'vue';

// 全局缓存，避免重复计算同一张图片
const brightnessCache = new Map();

/**
 * 计算图片平均亮度的 composable
 * @param {Ref<string>|string|Function} imageUrl - 图片 URL（支持响应式）
 * @param {Object} options - 配置选项
 * @param {number} options.threshold - 亮度阈值（0-255），低于此值认为是深色背景，默认 128
 * @param {number} options.sampleSize - 采样间隔，越大性能越好但精度越低，默认 10
 * @returns {Object} { brightness, isDark, isLoading, error }
 */
export function useImageBrightness(imageUrl, options = {}) {
  const {
    threshold = 128, // 亮度阈值
    sampleSize = 10, // 采样间隔
  } = options;

  const brightness = ref(null); // 亮度值（0-255）
  const isLoading = ref(false); // 加载状态
  const error = ref(null); // 错误信息

  // 是否为深色背景
  const isDark = computed(() => {
    if (brightness.value === null) return false;
    return brightness.value < threshold;
  });

  /**
   * 计算图片亮度
   * @param {string} url - 图片 URL
   */
  const calculateBrightness = async (url) => {
    if (!url) {
      brightness.value = null;
      return;
    }

    // 检查缓存
    if (brightnessCache.has(url)) {
      brightness.value = brightnessCache.get(url);
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // 加载图片
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 处理 CORS

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = url;
      });

      // 创建 canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // 获取像素数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      let count = 0;

      // 采样计算（跳过部分像素以提升性能）
      for (let i = 0; i < data.length; i += 4 * sampleSize) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 使用相对亮度公式（更符合人眼感知）
        // 参考：https://www.w3.org/TR/AERT/#color-contrast
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += luminance;
        count++;
      }

      const avgBrightness = Math.round(totalBrightness / count);

      // 缓存结果
      brightnessCache.set(url, avgBrightness);
      brightness.value = avgBrightness;
    } catch (err) {
      console.error('计算图片亮度失败:', err);
      error.value = err;
      brightness.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  // 监听 URL 变化（支持 ref、computed 或普通值）
  watch(
    () => {
      if (typeof imageUrl === 'function') {
        return imageUrl();
      }
      return typeof imageUrl === 'object' && imageUrl.value !== undefined
        ? imageUrl.value
        : imageUrl;
    },
    (newUrl) => {
      calculateBrightness(newUrl);
    },
    { immediate: true }
  );

  return {
    brightness, // 亮度值（0-255，null 表示未计算或失败）
    isDark, // 是否为深色背景
    isLoading, // 是否正在计算
    error, // 错误信息
  };
}

/**
 * 清除亮度缓存
 * @param {string} url - 可选，指定 URL 清除单个缓存，不传则清空所有缓存
 */
export function clearBrightnessCache(url) {
  if (url) {
    brightnessCache.delete(url);
  } else {
    brightnessCache.clear();
  }
}
