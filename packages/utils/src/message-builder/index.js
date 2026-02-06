/**
 * 消息通道类型
 */
export const MESSAGE_CHANNEL = {
  RUNTIME: 'runtime', // chrome.runtime.sendMessage
  SHARED: 'shared', // SharedWorker postMessage
};

/**
 * 消息构建器
 * 统一消息格式：{ from, to, action, data, service, channel, timestamp }
 */
export class MessageBuilder {
  #from = null;
  #service = null;

  /**
   * 私有构造函数
   * @private
   */
  constructor(from, service) {
    this.#from = from;
    this.#service = service;
  }

  /**
   * 创建消息构建器实例
   * @param {Object} options - 配置选项
   * @param {string} options.from - 发送方模块名称
   * @param {string} [options.service] - 服务名称
   * @returns {MessageBuilder} 构建器实例
   */
  static create({ from, service = null }) {
    if (!from) {
      throw new Error('发送方 (from) 不能为空');
    }
    return new MessageBuilder(from, service);
  }

  /**
   * 创建基础消息对象（内部方法）
   * @private
   */
  static #createBaseMessage({
    from,
    to,
    action,
    data = null,
    service = null,
    channel,
    timestamp = Date.now(),
  }) {
    // 验证必需参数
    if (!from) {
      throw new Error('发送方 (from) 不能为空');
    }
    if (!to) {
      throw new Error('接收方 (to) 不能为空');
    }
    if (!action) {
      throw new Error('动作 (action) 不能为空');
    }

    // 构建基础消息
    const message = {
      from,
      to,
      action,
      data,
      channel,
      timestamp,
    };

    // 只在有值时添加 service 字段
    if (service !== null && service !== undefined) {
      message.service = service;
    }

    return message;
  }

  /**
   * 创建 Runtime 消息（实例方法，自动使用预设的 from 和 service）
   * @param {Object} options - 消息选项
   * @param {string} options.to - 接收方模块名称
   * @param {string} options.action - 动作类型
   * @param {*} [options.data=null] - 消息数据
   * @param {string} [options.service] - 服务名称（可覆盖实例默认值）
   * @param {number} [options.timestamp] - 时间戳
   * @returns {Object} Runtime 消息对象
   */
  send({ to, action, data = null, service, timestamp = Date.now() }) {
    return MessageBuilder.#createBaseMessage({
      from: this.#from,
      to,
      action,
      data,
      service: service !== undefined ? service : this.#service,
      channel: MESSAGE_CHANNEL.RUNTIME,
      timestamp,
    });
  }

  /**
   * 创建 SharedWorker 消息（实例方法，自动使用预设的 from 和 service）
   * @param {Object} options - 消息选项
   * @param {string} options.to - 接收方模块名称
   * @param {string} options.action - 动作类型
   * @param {*} [options.data=null] - 消息数据（peerId 等信息放在这里）
   * @param {string} [options.service] - 服务名称（可覆盖实例默认值）
   * @param {number} [options.timestamp] - 时间戳
   * @returns {Object} SharedWorker 消息对象
   */
  sharedSend({ to, action, data = null, service, timestamp = Date.now() }) {
    return MessageBuilder.#createBaseMessage({
      from: this.#from,
      to,
      action,
      data,
      service: service !== undefined ? service : this.#service,
      channel: MESSAGE_CHANNEL.SHARED,
      timestamp,
    });
  }
}
