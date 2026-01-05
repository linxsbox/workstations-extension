/**
 * HTML5 Audio API 后端实现（降级方案）
 * 当 Web Audio API 不可用时使用原生 HTML5 Audio 元素
 */

import { AudioBackend } from './AudioBackend.js';

export class HTML5AudioBackend extends AudioBackend {
  constructor(options = {}) {
    super();
    this.audio = new Audio();
    this.volume = options.volume || 1;
    this.playbackRate = options.playbackRate || 1;

    // 事件系统
    this._listeners = new Map();

    // 设置初始属性
    this.audio.volume = this.volume;
    this.audio.playbackRate = this.playbackRate;

    this._setupAudioEvents();
  }

  /**
   * 设置音频元素事件
   */
  _setupAudioEvents() {
    const eventMap = {
      'loadstart': 'loadstart',
      'loadedmetadata': 'canplay',
      'play': 'play',
      'pause': 'pause',
      'ended': 'ended',
      'error': 'error',
      'timeupdate': 'timeupdate',
      'durationchange': 'durationchange',
      'seeked': 'seeked',
      'seeking': 'seeking',
      'volumechange': 'volumechange',
      'ratechange': 'ratechange',
    };

    Object.entries(eventMap).forEach(([nativeEvent, customEvent]) => {
      this.audio.addEventListener(nativeEvent, () => {
        if (nativeEvent === 'error') {
          const error = new Error(`Audio error: ${this.audio.error?.message || 'Unknown'}`);
          this._emit(customEvent, error);
        } else {
          this._emit(customEvent);
        }
      });
    });

    // 处理时间更新事件，定期触发
    let lastEmitTime = 0;
    this.audio.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastEmitTime > 100) {  // 每100ms最多触发一次
        lastEmitTime = now;
        this._emit('timeupdate', this.getCurrentTime());
      }
    });

    console.log('HTML5 Audio backend initialized');
  }

  /**
   * 加载音频文件
   */
  async load(src, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        this._emit('loadstart');

        this.audio.src = src;

        // 等待元数据加载完成
        const handleCanPlay = () => {
          this.audio.removeEventListener('canplay', handleCanPlay);
          this.audio.removeEventListener('error', handleError);
          this._emit('canplay');
          resolve(true);
        };

        const handleError = () => {
          this.audio.removeEventListener('canplay', handleCanPlay);
          this.audio.removeEventListener('error', handleError);
          const error = new Error(`Failed to load audio: ${src}`);
          this._emit('error', error);
          reject(error);
        };

        this.audio.addEventListener('canplay', handleCanPlay, { once: true });
        this.audio.addEventListener('error', handleError, { once: true });

        // 开始加载
        this.audio.load();
      } catch (error) {
        this._emit('error', error);
        reject(error);
      }
    });
  }

  /**
   * 播放
   */
  play() {
    try {
      this.audio.play();
      this._emit('play');
      return true;
    } catch (error) {
      console.error('Error playing audio:', error);
      this._emit('error', error);
      return false;
    }
  }

  /**
   * 暂停
   */
  pause() {
    try {
      this.audio.pause();
      this._emit('pause');
      return true;
    } catch (error) {
      console.error('Error pausing audio:', error);
      return false;
    }
  }

  /**
   * 停止（重置进度）
   */
  stop() {
    try {
      this.audio.pause();
      this.audio.currentTime = 0;
      this._emit('stop');
      return true;
    } catch (error) {
      console.error('Error stopping audio:', error);
      return false;
    }
  }

  /**
   * 跳转进度
   */
  seek(time) {
    try {
      const duration = this.getDuration();
      this.audio.currentTime = Math.max(0, Math.min(time, duration));
      this._emit('seeked', this.audio.currentTime);
      return true;
    } catch (error) {
      console.error('Error seeking audio:', error);
      return false;
    }
  }

  /**
   * 设置音量（0-1）
   */
  setVolume(volume) {
    try {
      this.volume = Math.max(0, Math.min(1, volume));
      this.audio.volume = this.volume;
      this._emit('volumechange', this.volume);
      return true;
    } catch (error) {
      console.error('Error setting volume:', error);
      return false;
    }
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate) {
    try {
      this.playbackRate = Math.max(0.5, Math.min(4, rate));
      this.audio.playbackRate = this.playbackRate;
      this._emit('ratechange', this.playbackRate);
      return true;
    } catch (error) {
      console.error('Error setting playback rate:', error);
      return false;
    }
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime() {
    return this.audio.currentTime || 0;
  }

  /**
   * 获取音频总时长
   */
  getDuration() {
    return this.audio.duration || 0;
  }

  /**
   * 是否正在播放
   */
  isPlaying() {
    return !this.audio.paused;
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    if (!this._listeners.has(event)) return;

    const callbacks = this._listeners.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 内部：触发事件
   */
  _emit(event, ...args) {
    if (!this._listeners.has(event)) return;

    const callbacks = this._listeners.get(event);
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
    this.stop();

    // 移除所有事件监听
    this.audio.removeAttribute('src');
    this.audio.load();

    this._listeners.clear();
    this.audio = null;
  }
}
