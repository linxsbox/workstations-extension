/**
 * 混合音频后端实现
 * 结合 HTML5 Audio 的流式加载能力和 Web Audio API 的高级音效处理能力
 * 实现网易云/Spotify 同款架构：<audio> → MediaElementSource → Analyser → GainNode → Destination
 */

import { AudioBackend } from './AudioBackend.js';

export class HybridAudioBackend extends AudioBackend {
  constructor(options = {}) {
    super();

    // Web Audio API 相关
    this.audioContext = null;
    this.mediaSource = null;
    this.analyser = null;
    this.gainNode = null;

    // HTML5 Audio 元素
    this.audio = null;

    // 状态管理
    this.isPlayingState = false;
    this.volume = options.volume || 1;
    this.playbackRate = options.playbackRate || 1;

    // 事件系统
    this._listeners = new Map();

    this.init();
  }

  /**
   * 初始化 - 一次性创建音频链路
   * ⚠️ 关键：MediaElementSource 只能创建一次，所以必须在构造函数中创建
   */
  init() {
    // 1. 创建 AudioContext（兼容 webkit）
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      throw new Error('Web Audio API is not supported');
    }
    this.audioContext = new AudioContext();

    // 2. 创建 Audio 元素
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous'; // 支持跨域资源
    this.audio.preload = 'metadata'; // ⚠️ 只加载元数据，避免预加载整个文件

    // 3. 创建 MediaElementSource - ⚠️ 检查支持性！
    // 某些浏览器或某些情况下此方法不可用
    if (
      !this.audioContext.createMediaElementAudioSource ||
      typeof this.audioContext.createMediaElementAudioSource !== 'function'
    ) {
      throw new Error('createMediaElementAudioSource is not supported');
    }
    this.mediaSource = this.audioContext.createMediaElementAudioSource(this.audio);

    // 4. 创建频谱分析节点
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256; // FFT 大小，会产生 128 个频率带
    this.analyser.smoothingTimeConstant = 0.8; // 平滑系数

    // 5. 创建音量控制节点
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.volume;

    // 6. 连接音频处理链
    // AudioElement → MediaElementSource → Analyser → GainNode → Destination
    this.mediaSource.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // 7. 设置原生事件监听和转发
    this._setupAudioEvents();

    console.log('Hybrid Audio Backend initialized successfully');
  }

  /**
   * 加载音频文件
   * ✅ 直接设置 src，浏览器自动处理流式加载
   */
  async load(src, metadata = {}) {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // 停止当前播放
      this.stop();
      this._emit('loadstart');

      // 设置音频源（不需要 fetch，浏览器自动处理）
      this.audio.src = src;

      // 开始加载
      this.audio.load();

      // 等待元数据加载完成
      return await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          this.audio.removeEventListener('canplay', handleCanPlay);
          this.audio.removeEventListener('error', handleError);

          // 更新 MediaSession API（如果支持）
          this._updateMediaSession(metadata);

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

        // 设置超时时间（10秒）
        setTimeout(() => {
          if (!this.audio.canplaythrough) {
            handleError();
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error loading audio in Hybrid Backend:', error);
      this._emit('error', error);
      return false;
    }
  }

  /**
   * 更新 MediaSession API 元数据
   */
  _updateMediaSession(metadata = {}) {
    if ('mediaSession' in navigator) {
      try {
        const { title, artist, album, duration } = metadata;

        // 构建 artwork 数组
        let artwork = [];
        if (album?.image) {
          artwork.push({
            src: album.image,
            sizes: '512x512',
            type: 'image/png'
          });
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || '未知标题',
          artist: artist || album?.author || '未知艺术家',
          album: album?.title || '未知专辑',
          artwork: artwork.length > 0 ? artwork : undefined
        });

        console.log('MediaSession metadata updated (Hybrid):', {
          title,
          artist: artist || album?.author,
          album: album?.title,
          duration
        });
      } catch (error) {
        console.warn('Failed to update MediaSession:', error);
      }
    }
  }

  /**
   * 播放
   */
  play() {
    if (!this.audio || !this.audio.src) {
      return false;
    }

    // 恢复被暂停的 AudioContext（用户手势后浏览器会自动暂停）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(error => {
        console.warn('Failed to resume AudioContext:', error);
      });
    }

    try {
      const playPromise = this.audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlayingState = true;
            this._emit('play');
          })
          .catch(error => {
            console.error('Play error:', error);
            this._emit('error', error);
          });
      } else {
        // 旧浏览器不返回 Promise
        this.isPlayingState = true;
        this._emit('play');
      }

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
    if (!this.isPlayingState) return false;

    try {
      this.audio.pause();
      this.isPlayingState = false;
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
      this.isPlayingState = false;
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
    if (!this.audio || !this.audio.src) return false;

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
    if (!this.gainNode) return false;

    try {
      this.volume = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.value = this.volume;
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
    if (!this.audio) return false;

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
    return this.audio ? this.audio.currentTime : 0;
  }

  /**
   * 获取音频总时长
   */
  getDuration() {
    return this.audio ? this.audio.duration : 0;
  }

  /**
   * 是否正在播放
   */
  isPlaying() {
    return this.isPlayingState;
  }

  /**
   * 获取频率数据（用于频谱可视化）
   * 返回 128 个频率带的强度数据（0-255）
   */
  getFrequencyData() {
    if (!this.analyser) {
      return new Uint8Array(0);
    }

    try {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray;
    } catch (error) {
      console.warn('Error getting frequency data:', error);
      return new Uint8Array(0);
    }
  }

  /**
   * 获取波形数据（用于示波器可视化）
   * 返回 128 个时域样本的幅度数据（0-255）
   */
  getWaveformData() {
    if (!this.analyser) {
      return new Uint8Array(0);
    }

    try {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(dataArray);
      return dataArray;
    } catch (error) {
      console.warn('Error getting waveform data:', error);
      return new Uint8Array(0);
    }
  }

  /**
   * 设置原生音频事件监听，并转发为统一事件
   */
  _setupAudioEvents() {
    const eventMap = {
      'loadstart': 'loadstart',
      'canplay': 'canplay',
      'play': 'play',
      'pause': 'pause',
      'ended': 'ended',
      'error': 'error',
      // 注意：timeupdate 单独处理（带节流），不在此列表中
      'durationchange': 'durationchange',
      'seeked': 'seeked',
      'seeking': 'seeking',
      'volumechange': 'volumechange',
      'ratechange': 'ratechange',
    };

    Object.entries(eventMap).forEach(([nativeEvent, customEvent]) => {
      this.audio.addEventListener(nativeEvent, () => {
        if (nativeEvent === 'error') {
          const error = new Error(
            `Audio error: ${this.audio.error?.message || 'Unknown error'}`
          );
          this._emit(customEvent, error);
        } else {
          this._emit(customEvent);
        }
      });
    });

    // 同步播放状态
    this.audio.addEventListener('play', () => {
      this.isPlayingState = true;
    });

    this.audio.addEventListener('pause', () => {
      this.isPlayingState = false;
    });

    // 时间更新事件节流（每 100ms 最多触发一次）
    let lastEmitTime = 0;
    this.audio.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - lastEmitTime > 100) {
        lastEmitTime = now;
        this._emit('timeupdate', this.getCurrentTime());
      }
    });
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

    // 断开音频链路
    if (this.mediaSource) {
      try {
        this.mediaSource.disconnect();
      } catch (error) {
        console.warn('Error disconnecting media source:', error);
      }
      this.mediaSource = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (error) {
        console.warn('Error disconnecting analyser:', error);
      }
      this.analyser = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (error) {
        console.warn('Error disconnecting gain node:', error);
      }
      this.gainNode = null;
    }

    // 清理 audio 元素
    if (this.audio) {
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }

    // 关闭 AudioContext
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        try {
          this.audioContext.close();
        } catch (error) {
          console.warn('Error closing audio context:', error);
        }
      }
      this.audioContext = null;
    }

    // 清理事件监听
    this._listeners.clear();
  }
}
