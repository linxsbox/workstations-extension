/**
 * 统一的音频管理器
 * 隐藏后端实现细节，提供统一的 API
 */

import { selectBackend, BACKEND_PRIORITY } from './index.js';

export class AudioManager {
  constructor(options = {}) {
    this.backend = null;
    this.options = options;
    this.listeners = new Map();
    this.initialized = false;
    this.backendIndex = 0;

    // 自动初始化
    this.init();
  }

  /**
   * 初始化音频管理器
   * 选择合适的后端并设置事件代理
   */
  async init() {
    try {
      this.backend = await selectBackend(this.options);
      this._setupBackendListeners();
      this.initialized = true;
      console.log('AudioManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
      throw error;
    }
  }

  /**
   * 设置后端事件监听和转发
   */
  _setupBackendListeners() {
    if (!this.backend) return;

    const eventsToProxy = [
      'loadstart',
      'canplay',
      'play',
      'pause',
      'stop',
      'ended',
      'error',
      'timeupdate',
      'durationchange',
      'seeked',
      'seeking',
      'volumechange',
      'ratechange',
    ];

    eventsToProxy.forEach(event => {
      this.backend.on(event, (...args) => {
        this._emit(event, ...args);
      });
    });
  }

  /**
   * 等待初始化完成
   */
  async waitForInit() {
    if (this.initialized) return true;

    return new Promise(resolve => {
      const checkInit = () => {
        if (this.initialized) {
          resolve(true);
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }

  /**
   * 加载音频
   * @param {string} src - 音频 URL
   * @param {Object} metadata - 元数据（title, artist, album等）
   * @returns {Promise<boolean>}
   */
  async load(src, metadata = {}) {
    if (!this.backend) {
      await this.waitForInit();
    }

    try {
      const success = await this.backend.load(src, {});
      if (success) {
        return true;
      }

      // 如果加载失败且还有其他后端可用，尝试切换后端
      console.warn(
        `Loading with ${this.backend.constructor.name} failed, attempting fallback...`
      );
      return await this._tryFallbackBackend(src);
    } catch (error) {
      console.error('Error loading audio:', error);
      // 尝试使用备用后端
      return await this._tryFallbackBackend(src);
    }
  }

  /**
   * 尝试使用备用后端加载
   */
  async _tryFallbackBackend(src) {
    // 获取当前后端的名称
    const currentBackendName = this.backend?.constructor.name;

    // 尝试其他后端
    for (const { name, backend: getBackend, supported } of BACKEND_PRIORITY) {
      const BackendClass = await getBackend();
      if (
        supported() &&
        BackendClass.name !== currentBackendName
      ) {
        try {
          console.log(`Switching to fallback backend: ${name}`);
          const fallbackBackend = new BackendClass(this.options);

          // 尝试用新后端加载
          const success = await fallbackBackend.load(src, {});
          if (success) {
            // 销毁旧后端并切换到新后端
            if (this.backend) {
              this.backend.destroy();
            }
            this.backend = fallbackBackend;
            this._setupBackendListeners();
            console.log(`Successfully switched to ${name} backend`);
            return true;
          } else {
            fallbackBackend.destroy();
          }
        } catch (error) {
          console.warn(`Fallback ${name} also failed:`, error);
          continue;
        }
      }
    }

    console.error('All backends failed to load audio');
    return false;
  }

  /**
   * 播放
   */
  play() {
    if (!this.backend) {
      console.warn('AudioManager not initialized');
      return false;
    }
    return this.backend.play();
  }

  /**
   * 暂停
   */
  pause() {
    if (!this.backend) {
      console.warn('AudioManager not initialized');
      return false;
    }
    return this.backend.pause();
  }

  /**
   * 停止（重置进度）
   */
  stop() {
    if (!this.backend) {
      console.warn('AudioManager not initialized');
      return false;
    }
    return this.backend.stop();
  }

  /**
   * 切换播放状态
   */
  togglePlay() {
    if (this.isPlaying()) {
      return this.pause();
    } else {
      return this.play();
    }
  }

  /**
   * 跳转进度
   * @param {number} time - 时间（秒）
   */
  seek(time) {
    if (!this.backend) {
      console.warn('AudioManager not initialized');
      return false;
    }
    return this.backend.seek(time);
  }

  /**
   * 设置音量（0-1）
   */
  setVolume(volume) {
    if (!this.backend) {
      console.warn('AudioManager not initialized');
      return false;
    }
    return this.backend.setVolume(volume);
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate) {
    if (!this.backend) {
      console.warn('AudioManager not initialized');
      return false;
    }
    return this.backend.setPlaybackRate(rate);
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime() {
    if (!this.backend) {
      return 0;
    }
    return this.backend.getCurrentTime();
  }

  /**
   * 获取音频总时长
   */
  getDuration() {
    if (!this.backend) {
      return 0;
    }
    return this.backend.getDuration();
  }

  /**
   * 是否正在播放
   */
  isPlaying() {
    if (!this.backend) {
      return false;
    }
    return this.backend.isPlaying();
  }

  /**
   * 获取后端类型名称
   */
  getBackendName() {
    if (!this.backend) {
      return 'Unknown';
    }

    const backendClass = this.backend.constructor.name;
    if (backendClass.includes('Hybrid')) {
      return 'Hybrid Audio (HTML5 + Web Audio API)';
    } else if (backendClass.includes('WebAudio')) {
      return 'Web Audio API';
    } else if (backendClass.includes('HTML5')) {
      return 'HTML5 Audio';
    }
    return backendClass;
  }

  /**
   * 获取频率数据（仅 Web Audio 支持）
   */
  getFrequencyData() {
    if (!this.backend || !this.backend.getFrequencyData) {
      return new Uint8Array(0);
    }
    return this.backend.getFrequencyData();
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 一次性事件监听
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * 内部：触发事件
   */
  _emit(event, ...args) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} handler:`, error);
      }
    });
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.backend) {
      this.backend.destroy();
      this.backend = null;
    }

    this.listeners.clear();
    this.initialized = false;
  }
}

// 导出单例
export const audioManager = new AudioManager();
