/**
 * Shared Worker Client Service
 * App 端的 SharedWorker 客户端服务
 * 用于与 extension 的各个模块通过 SharedWorker 进行通信
 */

import { createClient } from 'pkg-utils';
import { Logger } from '@linxs/toolkit';

const logger = new Logger('SharedClient');

/**
 * SharedWorker 通信模式说明：
 *
 * 通信类比：就像邮件系统
 * - clientName: 你的名字（收件人/发件人地址）
 * - messageType: 邮件主题/类别
 * - sendTo: 发送给指定的人
 *
 * 示例：
 *
 * 客户端 A (App):
 *   1. createClient('SHARED_APP')           // 注册名字为 'SHARED_APP'
 *   2. onMessage('WEBRTC', handler)         // 监听主题为 'WEBRTC' 的消息
 *   3. sendTo('WEBRTC', {type: 'GET_STATUS'}) // 发送给 'WEBRTC' 客户端
 *
 * 客户端 B (Extension WebRTC):
 *   1. createClient('WEBRTC')               // 注册名字为 'WEBRTC'
 *   2. onMessage('GET_STATUS', handler)     // 监听主题为 'GET_STATUS' 的消息
 *   3. sendTo('SHARED_APP', {data: ...})    // 回复给 'SHARED_APP' 客户端
 *
 * 通信流程：
 *   App ('SHARED_APP')
 *     ↓ sendTo('WEBRTC', {type: 'GET_STATUS'})
 *     ↓
 *   SharedWorker Hub (中转)
 *     ↓
 *   Extension WebRTC ('WEBRTC')
 *     ↓ onMessage('GET_STATUS') 处理
 *     ↓ sendTo('SHARED_APP', {data: status})
 *     ↓
 *   SharedWorker Hub (中转)
 *     ↓
 *   App ('SHARED_APP')
 *     ↓ 收到响应
 */

/**
 * SharedWorker 客户端服务类
 * 统一管理 App 端与 Extension 端的通信
 */
export class SharedClientService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.messageHandlers = new Map();
    this.readyCallbacks = [];
  }

  /**
   * 初始化客户端
   *
   * @param {string} clientName - 客户端名称（默认：'SHARED_APP'）
   *                               这个名称是该客户端在 SharedWorker 中的唯一标识
   *                               其他客户端可以通过这个名称向它发送消息
   *
   * @returns {Promise<{success: boolean, error?: string}>}
   *
   * @example
   * // 初始化为 'SHARED_APP'
   * await initSharedClient('SHARED_APP');
   *
   * // 现在其他客户端可以通过以下方式给它发消息：
   * // sendTo('SHARED_APP', { type: 'NOTIFICATION', message: 'Hello' })
   */
  async initialize(clientName = 'SHARED_APP') {
    try {
      logger.info('开始初始化...', clientName);

      // 创建 SharedWorker 客户端
      this.client = await createClient(clientName);

      logger.info('客户端创建成功');

      // 设置事件监听
      this.setupEventListeners();

      this.isReady = true;

      // 触发就绪回调
      this.readyCallbacks.forEach(callback => callback());
      this.readyCallbacks = [];

      logger.info('初始化完成');

      return { success: true };
    } catch (error) {
      logger.error('初始化失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 设置事件监听
   *
   * 监听 SharedWorker 的系统事件：
   * - clientJoined: 有新客户端加入
   * - clientLeft: 有客户端离开
   * - error: 发生错误
   * - disconnected: 连接断开
   */
  setupEventListeners() {
    // 监听客户端加入
    this.client.on('clientJoined', (data) => {
      logger.info('新客户端加入:', data.name);
    });

    // 监听客户端离开
    this.client.on('clientLeft', (data) => {
      logger.info('客户端离开:', data.name);
    });

    // 监听错误
    this.client.on('error', (data) => {
      logger.error('错误:', data);
    });

    // 监听断开连接
    this.client.on('disconnected', (data) => {
      logger.warn('连接断开:', data);
      this.isReady = false;
    });
  }

  /**
   * 注册消息处理器
   *
   * 监听特定类型的消息，当收到该类型消息时自动调用处理函数
   *
   * @param {string} messageType - 消息类型（类似邮件主题）
   * @param {Function} handler - 处理函数 (data, from) => void | Promise<any>
   *                             - data: 消息数据
   *                             - from: 发送者的客户端名称
   *                             - 返回值会自动作为响应发送给发送者
   *
   * @example
   * // 监听来自 WebRTC 模块的消息
   * onMessage('WEBRTC', (data, from) => {
   *   console.log('收到来自', from, '的 WebRTC 消息:', data);
   *   // 返回响应（可选）
   *   return { received: true };
   * });
   */
  onMessage(messageType, handler) {
    if (!this.client) {
      logger.error('客户端未初始化');
      return;
    }

    this.messageHandlers.set(messageType, handler);
    this.client.onMessage(messageType, handler);
  }

  /**
   * 移除消息处理器
   *
   * @param {string} messageType - 要移除的消息类型
   */
  offMessage(messageType) {
    if (!this.client) {
      logger.error('客户端未初始化');
      return;
    }

    this.messageHandlers.delete(messageType);
    this.client.offMessage(messageType);
  }

  /**
   * 发送消息到指定客户端（点对点通信）
   *
   * @param {string} targetClient - 目标客户端名称（如：'WEBRTC', 'SHARED_ONNX'）
   * @param {object} data - 消息数据，必须包含 type 字段指定消息类型
   * @param {number} timeout - 超时时间（毫秒），默认 30000ms
   *
   * @returns {Promise<any>} 目标客户端的响应数据
   *
   * @throws {Error} 如果客户端未初始化、未就绪或发送失败
   *
   * @example
   * // 向 WEBRTC 模块请求状态
   * const response = await sendTo('WEBRTC', {
   *   type: 'GET_STATUS',
   *   action: 'GET_STATUS'
   * });
   * console.log('WebRTC 状态:', response.status);
   */
  async sendTo(targetClient, data, timeout = 30000) {
    if (!this.client) {
      throw new Error('客户端未初始化');
    }

    if (!this.isReady) {
      throw new Error('客户端未就绪');
    }

    try {
      const response = await this.client.sendTo(targetClient, data, timeout);
      return response;
    } catch (error) {
      logger.error(`发送消息到 ${targetClient} 失败:`, error);
      throw error;
    }
  }

  /**
   * 广播消息给所有客户端（除了自己）
   *
   * @param {object} data - 消息数据
   *
   * @returns {Promise<{delivered: number, failed: number}>} 发送结果统计
   *
   * @example
   * // 广播通知给所有客户端
   * await broadcast({
   *   type: 'NOTIFICATION',
   *   message: '设置已更新',
   *   timestamp: Date.now()
   * });
   */
  async broadcast(data) {
    if (!this.client) {
      throw new Error('客户端未初始化');
    }

    if (!this.isReady) {
      throw new Error('客户端未就绪');
    }

    try {
      const response = await this.client.broadcast(data);
      return response;
    } catch (error) {
      logger.error('广播消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取在线客户端列表
   *
   * @returns {Promise<Array>} 客户端列表，每个元素包含：
   *   - name: 客户端名称
   *   - connectedAt: 连接时间戳
   *   - messageCount: 消息计数
   *
   * @example
   * const clients = await getClients();
   * console.log('在线客户端:', clients);
   * // [
   * //   { name: 'SHARED_APP', connectedAt: 1234567890, messageCount: 42 },
   * //   { name: 'WEBRTC', connectedAt: 1234567891, messageCount: 15 }
   * // ]
   */
  async getClients() {
    if (!this.client) {
      throw new Error('客户端未初始化');
    }

    try {
      const clients = await this.client.getClients();
      return clients;
    } catch (error) {
      logger.error('获取客户端列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取 SharedWorker 统计信息
   *
   * @returns {Promise<Object>} 统计信息：
   *   - totalMessages: 总消息数
   *   - totalClients: 总客户端数
   *   - currentClients: 当前在线客户端数
   *   - uptime: 运行时间（毫秒）
   *   - startTime: 启动时间戳
   */
  async getStats() {
    if (!this.client) {
      throw new Error('客户端未初始化');
    }

    try {
      const stats = await this.client.getStats();
      return stats;
    } catch (error) {
      logger.error('获取统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 发送 Ping 测试延迟
   *
   * @returns {Promise<{latency: number, timestamp: number}>}
   *   - latency: 往返延迟（毫秒）
   *   - timestamp: 服务器时间戳
   *
   * @example
   * const { latency } = await ping();
   * console.log('延迟:', latency, 'ms');
   */
  async ping() {
    if (!this.client) {
      throw new Error('客户端未初始化');
    }

    try {
      const result = await this.client.ping();
      return result;
    } catch (error) {
      logger.error('Ping 失败:', error);
      throw error;
    }
  }

  /**
   * 等待客户端就绪
   *
   * 如果客户端已就绪，立即返回
   * 如果未就绪，等待直到初始化完成
   *
   * @returns {Promise<void>}
   *
   * @example
   * await waitForReady();
   * console.log('客户端已就绪，可以开始通信');
   */
  async waitForReady() {
    if (this.isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.readyCallbacks.push(resolve);
    });
  }

  /**
   * 断开与 SharedWorker 的连接
   *
   * 清理所有资源：
   * - 断开 SharedWorker 连接
   * - 清空客户端实例
   * - 清空消息处理器
   * - 重置就绪状态
   */
  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.isReady = false;
      this.messageHandlers.clear();
      logger.info('已断开连接');
    }
  }

  /**
   * 获取客户端连接状态
   *
   * @returns {Object} 状态信息：
   *   - isReady: 是否已就绪
   *   - hasClient: 是否有客户端实例
   *   - handlerCount: 已注册的消息处理器数量
   */
  getStatus() {
    return {
      isReady: this.isReady,
      hasClient: !!this.client,
      handlerCount: this.messageHandlers.size,
    };
  }
}

/**
 * SharedClientService 单例实例
 * 整个应用共享同一个 SharedWorker 客户端连接
 */
export const sharedClientService = new SharedClientService();

/**
 * 初始化 SharedWorker 客户端
 * @param {string} clientName - 客户端名称（默认：'SHARED_APP'）
 */
export const initSharedClient = (clientName) => sharedClientService.initialize(clientName);

/**
 * 注册消息处理器
 * @param {string} type - 消息类型
 * @param {Function} handler - 处理函数
 */
export const onMessage = (type, handler) => sharedClientService.onMessage(type, handler);

/**
 * 发送消息到指定客户端
 * @param {string} target - 目标客户端名称
 * @param {object} data - 消息数据
 * @param {number} timeout - 超时时间
 */
export const sendTo = (target, data, timeout) => sharedClientService.sendTo(target, data, timeout);

/**
 * 广播消息给所有客户端
 * @param {object} data - 消息数据
 */
export const broadcast = (data) => sharedClientService.broadcast(data);

/** 获取在线客户端列表 */
export const getClients = () => sharedClientService.getClients();

/** 获取统计信息 */
export const getStats = () => sharedClientService.getStats();

/** 发送 Ping 测试 */
export const ping = () => sharedClientService.ping();

/** 等待客户端就绪 */
export const waitForReady = () => sharedClientService.waitForReady();

/** 断开连接 */
export const disconnect = () => sharedClientService.disconnect();

/** 获取连接状态 */
export const getStatus = () => sharedClientService.getStatus();
