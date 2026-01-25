/**
 * 音频后端抽象基类
 * 定义所有后端必须实现的接口
 */

export class AudioBackend {
  /**
   * 加载音频
   * @param {string} src - 音频 URL
   * @param {Object} options - 加载选项
   * @returns {Promise<boolean>} 加载是否成功
   */
  async load(src, options = {}) {
    throw new Error('Method not implemented: load()');
  }

  /**
   * 播放
   * @returns {boolean} 播放是否启动
   */
  play() {
    throw new Error('Method not implemented: play()');
  }

  /**
   * 暂停
   * @returns {boolean} 暂停是否成功
   */
  pause() {
    throw new Error('Method not implemented: pause()');
  }

  /**
   * 停止（重置进度）
   * @returns {boolean} 停止是否成功
   */
  stop() {
    throw new Error('Method not implemented: stop()');
  }

  /**
   * 跳转到指定时间
   * @param {number} time - 时间（秒）
   * @returns {boolean} 跳转是否成功
   */
  seek(time) {
    throw new Error('Method not implemented: seek()');
  }

  /**
   * 设置音量
   * @param {number} volume - 音量（0-1）
   * @returns {boolean} 设置是否成功
   */
  setVolume(volume) {
    throw new Error('Method not implemented: setVolume()');
  }

  /**
   * 设置播放速率
   * @param {number} rate - 播放速率（0.5-4）
   * @returns {boolean} 设置是否成功
   */
  setPlaybackRate(rate) {
    throw new Error('Method not implemented: setPlaybackRate()');
  }

  /**
   * 获取当前播放时间
   * @returns {number} 当前时间（秒）
   */
  getCurrentTime() {
    throw new Error('Method not implemented: getCurrentTime()');
  }

  /**
   * 获取音频总时长
   * @returns {number} 总时长（秒）
   */
  getDuration() {
    throw new Error('Method not implemented: getDuration()');
  }

  /**
   * 检查是否正在播放
   * @returns {boolean} 是否播放中
   */
  isPlaying() {
    throw new Error('Method not implemented: isPlaying()');
  }

  /**
   * 事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    throw new Error('Method not implemented: on()');
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    throw new Error('Method not implemented: off()');
  }

  /**
   * 清理资源
   */
  destroy() {
    throw new Error('Method not implemented: destroy()');
  }
}
