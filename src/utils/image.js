/**
 * 图片处理工具函数
 */

/**
 * 将图片转换为 Base64 格式
 * @param {string} url - 图片 URL
 * @param {string} format - 输出格式，默认 'image/png'
 * @param {number} quality - 图片质量 (0-1)，仅对 image/jpeg 有效
 * @returns {Promise<string>} 返回 base64 格式的图片 URL
 */
export async function imageToBase64(url, format = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域

    img.onload = () => {
      try {
        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制图片
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // 转换为 base64
        const base64Url = canvas.toDataURL(format, quality);
        resolve(base64Url);
      } catch (error) {
        reject(new Error(`Failed to convert image to base64: ${error.message}`));
      }
    };

    img.onerror = (error) => {
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
}

/**
 * 尝试加载封面图片，支持多种格式回退
 * @param {string} originalUrl - 原始图片 URL
 * @returns {Promise<string>} 返回可用的图片 URL（可能是 base64）
 */
export async function loadCoverImageWithFallback(originalUrl) {
  if (!originalUrl) {
    return null;
  }

  // 检查是否已经有图片后缀（支持带查询参数的 URL）
  const hasExtension = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(originalUrl);

  // 如果已经有后缀，直接尝试加载（不转 base64）
  if (hasExtension) {
    try {
      await tryLoadImage(originalUrl);
      return originalUrl;
    } catch {
      // 有扩展名但加载失败，直接返回 null（不尝试 base64）
      return null;
    }
  }

  // 没有后缀时，按优先级尝试多种格式
  const formats = ['.jpg', '.webp', '.png'];

  for (const format of formats) {
    const url = originalUrl + format;
    try {
      await tryLoadImage(url);
      return url;
    } catch {
      // 继续尝试下一个格式
      continue;
    }
  }

  // 所有格式都失败，尝试无后缀的原始 URL 并转换为 base64
  try {
    const base64Url = await imageToBase64(originalUrl);
    return base64Url;
  } catch {
    // 最终失败
    return null;
  }
}

/**
 * 尝试加载单个图片 URL
 * @param {string} url - 图片 URL
 * @returns {Promise<void>}
 */
function tryLoadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * 同步方式获取封面图片 URL 数组（用于按优先级尝试）
 * @param {string} originalUrl - 原始图片 URL
 * @returns {string[]} 返回按优先级排序的 URL 数组
 */
export function getCoverImageFormats(originalUrl) {
  if (!originalUrl) {
    return [];
  }

  // 检查是否已经有图片后缀（支持带查询参数的 URL）
  const hasExtension = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(originalUrl);

  // 如果已经有后缀，直接返回
  if (hasExtension) {
    return [originalUrl];
  }

  // 没有后缀时，返回多种格式，包含特殊标记以便后续处理
  return [
    originalUrl + '.jpg',
    originalUrl + '.webp',
    originalUrl + '.png',
    originalUrl, // 原始无后缀 URL，在组件中会转换为 base64
  ];
}

/**
 * 尝试加载图片，如果是无后缀的 URL 则转换为 base64
 * @param {string} url - 图片 URL
 * @param {boolean} isLastAttempt - 是否是最后一次尝试（无后缀的原始 URL）
 * @param {boolean} hasOriginalExtension - 原始 URL 是否有扩展名
 * @returns {Promise<string>} 返回可用的 URL（原始或 base64）
 */
export async function tryLoadCoverImage(url, isLastAttempt = false, hasOriginalExtension = false) {
  if (!url) {
    throw new Error('No URL provided');
  }

  // 如果原始 URL 有扩展名，不进行 base64 转换，直接加载或失败
  if (hasOriginalExtension) {
    await tryLoadImage(url);
    return url;
  }

  // 如果不是最后一次尝试，直接尝试加载
  if (!isLastAttempt) {
    await tryLoadImage(url);
    return url;
  }

  // 最后一次尝试：无后缀的原始 URL，转换为 base64
  try {
    const base64Url = await imageToBase64(url);
    return base64Url;
  } catch (error) {
    throw new Error(`Failed to load image as base64: ${error.message}`);
  }
}

