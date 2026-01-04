/**
 * Web Audio API 后端实现
 * 使用 Web Audio API 进行高级音频处理
 */

import { AudioBackend } from './AudioBackend.js';

export class WebAudioBackend extends AudioBackend {
  constructor(options = {}) {
    super();
    this.audioContext = null;
    this.audioSource = null;
    this.audioBuffer = null;
    this.gainNode = null;
    this.analyser = null;

    this.isPlayingState = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.volume = options.volume || 1;
    this.playbackRate = options.playbackRate || 1;

    // 事件系统
    this._listeners = new Map();

    this.init();
  }

  /**
   * 初始化 Web Audio Context
   */
  init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // 创建 GainNode（音量控制）
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);

      // 创建 Analyser 节点（可用于可视化）
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.gainNode);

      console.log('Web Audio API initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error);
      return false;
    }
  }

  /**
   * 加载音频文件
   */
  async load(src, options = {}) {
    try {
      if (!this.audioContext) {
        if (!this.init()) {
          throw new Error('Audio context initialization failed');
        }
      }

      this.stop();
      this._emit('loadstart');

      // 获取音频数据
      let arrayBuffer;
      if (options.arrayBuffer) {
        arrayBuffer = options.arrayBuffer;
      } else {
        try {
          const response = await fetch(src, {
            credentials: 'omit',
            mode: 'cors',
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          arrayBuffer = await response.arrayBuffer();
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          throw new Error(`Failed to fetch audio: ${fetchError.message}`);
        }
      }

      // 解码音频数据
      try {
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      } catch (decodeError) {
        console.error('Decode error:', decodeError);
        throw new Error(`Failed to decode audio: ${decodeError.message}`);
      }

      this._emit('canplay');
      return true;
    } catch (error) {
      console.error('Error loading audio in WebAudioBackend:', error);
      this._emit('error', error);
      return false;
    }
  }

  /**
   * 播放
   */
  play() {
    if (!this.audioBuffer) return false;

    // 恢复暂停的 AudioContext
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 创建新的 source node
    this.audioSource = this.audioContext.createBufferSource();
    this.audioSource.buffer = this.audioBuffer;
    this.audioSource.playbackRate.value = this.playbackRate;

    // 连接节点
    this.audioSource.connect(this.analyser);

    // 设置播放结束事件
    this.audioSource.onended = () => {
      this.isPlayingState = false;
      this.pauseTime = 0;
      this._emit('ended');
    };

    // 从暂停位置开始播放
    const startOffset = this.pauseTime;
    this.audioSource.start(0, startOffset);
    this.startTime = this.audioContext.currentTime - startOffset;
    this.isPlayingState = true;

    this._emit('play');
    return true;
  }

  /**
   * 暂停
   */
  pause() {
    if (!this.isPlayingState) return false;

    this.pauseTime = this.getCurrentTime();
    this._stopSource();
    this.isPlayingState = false;

    this._emit('pause');
    return true;
  }

  /**
   * 停止（重置进度）
   */
  stop() {
    this.pauseTime = 0;
    this._stopSource();
    this.isPlayingState = false;

    this._emit('stop');
    return true;
  }

  /**
   * 内部：停止音频源
   */
  _stopSource() {
    if (this.audioSource) {
      try {
        this.audioSource.onended = null;
        this.audioSource.stop();
      } catch (error) {
        console.warn('Error stopping audio source:', error);
      }
      try {
        this.audioSource.disconnect();
      } catch (error) {
        console.warn('Error disconnecting audio source:', error);
      }
      this.audioSource = null;
    }
  }

  /**
   * 跳转进度
   */
  seek(time) {
    if (!this.audioBuffer) return false;

    const wasPlaying = this.isPlayingState;

    if (wasPlaying) {
      this.pause();
    }

    this.pauseTime = Math.max(0, Math.min(time, this.getDuration()));

    if (wasPlaying) {
      this.play();
    }

    this._emit('seeked', this.pauseTime);
    return true;
  }

  /**
   * 设置音量（0-1）
   */
  setVolume(volume) {
    if (!this.gainNode) return false;

    this.volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this.volume;

    this._emit('volumechange', this.volume);
    return true;
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.5, Math.min(4, rate));

    if (this.audioSource) {
      this.audioSource.playbackRate.value = this.playbackRate;
    }

    this._emit('ratechange', this.playbackRate);
    return true;
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime() {
    if (!this.audioBuffer) return 0;

    if (this.isPlayingState && this.audioContext) {
      return this.audioContext.currentTime - this.startTime;
    }

    return this.pauseTime;
  }

  /**
   * 获取音频总时长
   */
  getDuration() {
    return this.audioBuffer?.duration || 0;
  }

  /**
   * 是否正在播放
   */
  isPlaying() {
    return this.isPlayingState;
  }

  /**
   * 获取频率数据（用于可视化）
   */
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  /**
   * 获取波形数据（用于可视化）
   */
  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    return dataArray;
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

    this.audioBuffer = null;
    this._listeners.clear();
  }
}
