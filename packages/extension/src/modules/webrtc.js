/**
 * WebRTC 模块
 * 提供 WebRTC 连接管理和数据通信功能
 */
import { defaultStorage, Logger, simpleUUID } from '@linxs/toolkit';
import { WEBRTC_ACTIONS, APP_ACTIONS, MessageBuilder } from 'pkg-utils';
import { createClient } from 'pkg-utils';

const logger = new Logger('WebRTC');

/**
 * WebRTC 管理器
 * 负责 WebRTC 连接的生命周期管理
 *
 * 职责：
 * - 管理 Peer 实例
 * - 管理连接
 * - 通过回调上报事件（不直接发消息）
 */
export class WebRTCManager {
  /**
   * @param {Object} eventEmitter - 事件发射器 {emit: (event, data) => void}
   */
  constructor(eventEmitter) {
    this.peer = null;
    this.peerId = null;
    this.connections = new Map();
    this.eventEmitter = eventEmitter;

    const { localStorage } = defaultStorage();
    this.local = localStorage;
  }

  /**
   * 获取或创建 Peer ID
   * 优先级：内存 > 存储 > 新建
   */
  async getOrCreatePeerId() {
    // 1. 如果内存中已有，直接返回
    if (this.peerId) {
      return this.peerId;
    }

    // 2. 从本地存储读取
    const savedPeerId = await this.local.get('webrtc_peer_id');
    if (savedPeerId) {
      logger.info('从存储中恢复 Peer ID:', savedPeerId);
      this.peerId = savedPeerId;
      return savedPeerId;
    }

    // 3. 生成新的 Peer ID 并存储
    const newPeerId = 'peer-' + simpleUUID();
    logger.info('生成新的 Peer ID:', newPeerId);
    await this.local.set('webrtc_peer_id', newPeerId);
    this.peerId = newPeerId;
    return newPeerId;
  }

  /**
   * 初始化 WebRTC 连接
   */
  async init() {
    try {
      // 获取或创建 Peer ID
      this.peerId = await this.getOrCreatePeerId();

      // 创建 Peer 实例
      this.peer = new Peer(this.peerId, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:19302' },
          ],
        },
      });

      this.setupPeerListeners();

      return { success: true };
    } catch (error) {
      logger.error('初始化失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 设置 Peer 事件监听器
   */
  setupPeerListeners() {
    // Peer 连接成功
    this.peer.on('open', (id) => {
      this.peerId = id;
      logger.info('Peer 已连接, ID:', id);

      // 通过事件回调上报
      this.eventEmitter.emit('ready', { peerId: id });
    });

    // 收到连接请求
    this.peer.on('connection', (conn) => {
      this.handleConnection(conn);
    });

    // 发生错误
    this.peer.on('error', (err) => {
      logger.error('发生错误:', err);
      this.eventEmitter.emit('error', { error: err.message });
    });

    // 断开连接
    this.peer.on('disconnected', () => {
      logger.warn('Peer 断开连接');
      this.eventEmitter.emit('disconnected', {});
    });

    // 关闭
    this.peer.on('close', () => {
      logger.warn('Peer 已关闭');
      this.eventEmitter.emit('closed', {});
    });
  }

  /**
   * 处理连接
   */
  handleConnection(conn) {
    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      logger.info('设备已连接:', conn.peer);
      this.eventEmitter.emit('connection-opened', { peer: conn.peer });
    });

    conn.on('data', (data) => {
      // 通过事件回调上报数据
      this.eventEmitter.emit('data', { peer: conn.peer, data });
    });

    conn.on('close', () => {
      logger.info('设备已断开:', conn.peer);
      this.connections.delete(conn.peer);
      this.eventEmitter.emit('connection-closed', { peer: conn.peer });
    });

    conn.on('error', (err) => {
      logger.error('连接错误:', err);
      this.eventEmitter.emit('connection-error', {
        peer: conn.peer,
        error: err.message,
      });
    });
  }

  /**
   * 发送数据
   */
  sendData(targetPeerId, data) {
    const conn = this.connections.get(targetPeerId);
    if (conn && conn.open) {
      conn.send(data);
      return { success: true };
    }
    return { success: false, error: '连接不存在或未打开' };
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
      this.peerId = null;
      this.connections.clear();
    }
    return { success: true };
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      peerId: this.peerId,
      connected: this.peer && !this.peer.disconnected,
      destroyed: this.peer && this.peer.destroyed,
      connections: Array.from(this.connections.keys()),
    };
  }
}

/**
 * WebRTC 行为处理器
 * 处理各种 WebRTC 动作和消息通信
 *
 * 职责：
 * - 处理来自 App 的 action (INIT, GET_STATUS 等)
 * - 管理 SharedClient，处理双向通信
 * - 接收 Manager 的事件，通过 SharedWorker 转发给 App
 */
export class WebRTCActionHandler {
  constructor() {
    this.manager = null;
    this.sharedClient = null;
    this.initialized = false;
    // 创建消息构建器
    this.messageBuilder = MessageBuilder.create({
      from: WEBRTC_ACTIONS.MODULE_NAME,
    });
  }

  /**
   * 初始化（仅在收到 INIT action 时调用一次）
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('WebRTC 已初始化，跳过重复初始化');
      return;
    }

    try {
      // 1. 创建 WebRTCManager，注入事件回调
      this.manager = new WebRTCManager({
        emit: (event, data) => this.handleEvent(event, data),
      });

      // 2. 初始化 SharedClient（不等待 App）
      this.sharedClient = await createClient(WEBRTC_ACTIONS.SHARED_NAME);

      // 3. 注册 SharedWorker 消息处理器
      this.setupMessageHandlers();

      this.initialized = true;
    } catch (error) {
      logger.error('WebRTC 模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册 SharedWorker 消息处理器
   */
  setupMessageHandlers() {
    // 处理来自 App 的查询状态请求
    this.sharedClient.onMessage('GET_STATUS', (data, from) => {
      return this.manager.getStatus();
    });

    // 处理来自 App 的发送数据请求
    this.sharedClient.onMessage('SEND_DATA', (data, from) => {
      return this.manager.sendData(data.targetPeerId, data.data);
    });

    // 处理来自 App 的断开连接请求
    this.sharedClient.onMessage('DISCONNECT', (data, from) => {
      return this.manager.disconnect();
    });
  }

  /**
   * 处理 Manager 的事件，转发给 App
   */
  async handleEvent(event, data) {
    try {
      switch (event) {
        case 'ready':
          // Peer 连接成功，通过 chrome.runtime.sendMessage 发送 READY 给 App
          await this.sendReadyToApp(data.peerId);
          break;

        case 'error':
          // 发生错误，通知 App
          logger.error('发送 ERROR 消息给 App:', data.error);
          await this.sendToApp(WEBRTC_ACTIONS.ERROR, { data: data });
          break;

        case 'data':
          // 收到移动端数据，转发给 App
          await this.sendToApp(WEBRTC_ACTIONS.DATA, {
            type: data.data?.type,
            data: data.data,
            peerId: data.peer,
          });
          break;

        case 'connection-opened':
          // 新连接建立
          logger.info('移动端设备已连接:', data.peer);
          await this.sendToApp(WEBRTC_ACTIONS.CONNECTION_OPENED, {
            data: data,
            peerId: data.peer,
          });
          break;

        case 'connection-closed':
          // 连接关闭
          logger.info('移动端设备已断开:', data.peer);
          await this.sendToApp(WEBRTC_ACTIONS.CONNECTION_CLOSED, {
            data: data,
            peerId: data.peer,
          });
          break;

        case 'connection-error':
          // 连接错误
          logger.error('移动端连接错误:', data);
          await this.sendToApp(WEBRTC_ACTIONS.CONNECTION_ERROR, {
            data: data,
            peerId: data.peer,
          });
          break;

        case 'disconnected':
          // Peer 断开
          logger.warn('Peer 已断开');
          await this.sendToApp(WEBRTC_ACTIONS.DISCONNECTED, { data: data });
          break;

        case 'closed':
          // Peer 关闭
          logger.warn('Peer 已关闭');
          await this.sendToApp(WEBRTC_ACTIONS.CLOSED, { data: data });
          break;

        default:
          logger.warn('未处理的事件:', event);
      }
    } catch (error) {
      logger.error('发送事件失败:', event, error);
    }
  }

  /**
   * 发送消息到 App（自动选择通道）
   * SharedWorker: 使用统一格式 { from, to, action, type, data, peerId, timestamp }
   * chrome.runtime.sendMessage: 使用原有格式 { from, to, action, data }
   */
  async sendToApp(action, options = {}) {
    // 优先尝试 SharedWorker（使用统一格式）
    if (this.sharedClient) {
      try {
        // 先检查 App 客户端是否在线
        const clients = await this.sharedClient.getClients();
        const hasApp = clients.some(
          (client) => client.name === APP_ACTIONS.SHARED_NAME
        );

        if (hasApp) {
          // App 在线，使用 SharedWorker 发送（统一格式）
          const sharedMessage = this.messageBuilder.sharedSend({
            to: APP_ACTIONS.MODULE_NAME,
            action,
            data: {
              ...options.data,
              peerId: options.peerId || this.manager.peerId,
            },
          });
          await this.sharedClient.sendTo(
            APP_ACTIONS.SHARED_NAME,
            sharedMessage
          );
          return;
        }
      } catch (error) {
        logger.warn(
          `SharedWorker 发送失败，降级使用 chrome.runtime.sendMessage:`,
          error
        );
      }
    }

    // 降级到 chrome.runtime.sendMessage（原有格式）
    try {
      const message = this.messageBuilder.send({
        to: APP_ACTIONS.MODULE_NAME,
        action: action,
        data: options.data,
      });
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      logger.error(`chrome.runtime.sendMessage 发送失败:`, error);
    }
  }

  /**
   * 通过 chrome.runtime.sendMessage 发送 READY 给 App（原有格式）
   */
  async sendReadyToApp(peerId) {
    try {
      const message = this.messageBuilder.send({
        to: APP_ACTIONS.MODULE_NAME,
        action: WEBRTC_ACTIONS.READY,
        data: { peerId },
      });

      // 直接通过 chrome.runtime.sendMessage 广播消息
      // App 端的 chrome.runtime.onMessage 会接收到
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      logger.error('发送 READY 消息失败:', error);
    }
  }

  /**
   * 处理动作
   */
  async handle({ action, data }) {
    switch (action) {
      case WEBRTC_ACTIONS.INIT:
        // 收到 INIT，先初始化模块，再初始化 Peer
        await this.initialize();
        const result = await this.manager.init();
        return {
          success: result.success,
          message: result.success
            ? '正在连接到 PeerJS 服务器...'
            : result.error,
          peerId: this.manager.peerId,
        };

      case WEBRTC_ACTIONS.GET_STATUS:
        if (!this.initialized) {
          return { success: false, error: 'WebRTC 未初始化' };
        }
        return { success: true, status: this.manager.getStatus() };

      case WEBRTC_ACTIONS.SEND_DATA:
        if (!this.initialized) {
          return { success: false, error: 'WebRTC 未初始化' };
        }
        return this.manager.sendData(data.targetPeerId, data.data);

      case WEBRTC_ACTIONS.DISCONNECT:
        if (!this.initialized) {
          return { success: false, error: 'WebRTC 未初始化' };
        }
        return this.manager.disconnect();

      default:
        return { success: false, error: `未知的动作: ${action}` };
    }
  }
}
