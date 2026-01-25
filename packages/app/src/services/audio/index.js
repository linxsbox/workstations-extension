/**
 * 后端导出和优先级配置
 */

export { AudioBackend } from './AudioBackend.js';
export { HybridAudioBackend } from './HybridAudioBackend.js';
export { WebAudioBackend } from './WebAudioBackend.js';
export { HTML5AudioBackend } from './HTML5AudioBackend.js';

/**
 * 后端优先级链
 * 按优先级尝试初始化，如果不支持则使用下一个
 *
 * 优先级：HybridAudio > WebAudio > HTML5Audio
 *
 * HybridAudio：结合 HTML5 Audio 的流式加载和 Web Audio API 的高级功能
 * WebAudio：纯 Web Audio API，需要完整下载（降级方案 1）
 * HTML5Audio：纯 HTML5 Audio，流式播放但无高级功能（降级方案 2）
 */
export const BACKEND_PRIORITY = [
  {
    name: 'HybridAudio',
    backend: () => import('./HybridAudioBackend.js').then(m => m.HybridAudioBackend),
    supported: () => {
      // 需要同时支持 Audio 元素和 Web Audio API
      return !!(window.Audio && (window.AudioContext || window.webkitAudioContext));
    },
  },
  {
    name: 'WebAudio',
    backend: () => import('./WebAudioBackend.js').then(m => m.WebAudioBackend),
    supported: () => !!(window.AudioContext || window.webkitAudioContext),
  },
  {
    name: 'HTML5Audio',
    backend: () => import('./HTML5AudioBackend.js').then(m => m.HTML5AudioBackend),
    supported: () => !!window.Audio,
  },
];

/**
 * 自动选择合适的后端
 * @param {Object} options - 配置选项
 * @param {string} options.preferredBackend - 优先使用的后端 ('HTML5Audio' | 'WebAudio' | 'HybridAudio')
 * @returns {AudioBackend} 音频后端实例
 */
export async function selectBackend(options = {}) {
  const { preferredBackend } = options;

  // 如果指定了首选后端，先尝试使用它
  if (preferredBackend) {
    const preferred = BACKEND_PRIORITY.find(b => b.name === preferredBackend);
    if (preferred && preferred.supported()) {
      try {
        const BackendClass = await preferred.backend();
        console.log(`Selected preferred audio backend: ${preferredBackend}`);
        return new BackendClass(options);
      } catch (error) {
        console.warn(`Failed to initialize preferred ${preferredBackend} backend:`, error);
        console.log('Falling back to automatic selection...');
      }
    } else {
      console.warn(`Preferred backend ${preferredBackend} not supported, falling back...`);
    }
  }

  // 自动选择（原有逻辑）
  for (const { name, backend: getBackend, supported } of BACKEND_PRIORITY) {
    if (supported()) {
      try {
        const BackendClass = await getBackend();
        console.log(`Selected audio backend: ${name}`);
        return new BackendClass(options);
      } catch (error) {
        console.warn(`Failed to initialize ${name} backend:`, error);
        continue;
      }
    }
  }

  throw new Error('No audio backend available - neither Web Audio nor HTML5 Audio is supported');
}
