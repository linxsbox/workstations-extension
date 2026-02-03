import { Logger } from "@linxs/toolkit";
import { SHARED_WORKER_ACTIONS as SWA } from 'pkg-utils/constants';

const logger = new Logger('Shared Worker');
/**
 * SharedWorker 长连接服务中心
 * 功能：
 * 1. 管理所有客户端连接（扩展页面、offscreen、content script 等）
 * 2. 支持点对点通信
 * 3. 支持广播通信
 * 4. 支持请求/响应模式
 * 5. 连接状态管理和监控
 */

class SharedWorkerHub {
  constructor() {
    // 存储所有客户端连接: clientName -> { port, info }
    this.clients = new Map();

    // 消息统计
    this.stats = {
      totalMessages: 0,
      totalClients: 0,
      startTime: Date.now()
    };

    logger.info('服务中心已启动');
  }

  /**
   * 处理新的客户端连接
   */
  handleConnect(event) {
    const port = event.ports[0];
    let clientName = null;
    let clientInfo = {
      port: port,
      connectedAt: Date.now(),
      messageCount: 0
    };

    port.onmessage = (e) => {
      try {
        this.handleMessage(e.data, port, clientName, clientInfo);
      } catch (error) {
        logger.error('消息处理错误:', error);
        this.sendError(port, null, error.message);
      }
    };

    port.onmessageerror = (e) => {
      logger.error('消息解析错误:', e);
    };

    port.start();

    // 保存客户端信息的引用（通过闭包）
    const updateClientName = (name) => {
      clientName = name;
      clientInfo.name = name;
    };

    // 返回更新客户端名称的函数
    return updateClientName;
  }

  /**
   * 处理客户端消息
   */
  handleMessage(msg, port, clientName, clientInfo) {
    this.stats.totalMessages++;

    if (!msg || typeof msg !== 'object') {
      this.sendError(port, null, 'Invalid message format');
      return;
    }

    const { type, name, to, data, requestId, broadcast } = msg;

    // 1. 注册客户端
    if (type === SWA.REGISTER) {
      this.registerClient(name, port, clientInfo);
      return;
    }

    // 未注册的客户端不能发送其他消息
    if (!clientName) {
      this.sendError(port, requestId, 'Client not registered');
      return;
    }

    clientInfo.messageCount++;

    // 2. 获取客户端列表
    if (type === SWA.GET_CLIENTS) {
      this.sendClientList(port, requestId);
      return;
    }

    // 3. 获取统计信息
    if (type === SWA.GET_STATS) {
      this.sendStats(port, requestId);
      return;
    }

    // 4. Ping/Pong 心跳
    if (type === SWA.PING) {
      port.postMessage({
        type: SWA.PONG,
        requestId,
        timestamp: Date.now()
      });
      return;
    }

    // 5. 点对点消息
    if (to) {
      this.sendToClient(clientName, to, data, requestId);
      return;
    }

    // 6. 广播消息
    if (broadcast) {
      this.broadcastMessage(clientName, data, requestId);
      return;
    }

    // 未知的消息类型
    logger.warn('未知的消息类型:', type);
  }

  /**
   * 注册新客户端
   */
  registerClient(name, port, clientInfo) {
    if (!name || typeof name !== 'string') {
      this.sendError(port, null, 'Invalid client name');
      return;
    }

    // 检查名称是否已被占用
    if (this.clients.has(name)) {
      logger.warn(`客户端 ${name} 已存在，将覆盖旧连接`);
      // 通知旧连接被踢出
      const oldClient = this.clients.get(name);
      oldClient.port.postMessage({
        type: SWA.DISCONNECTED,
        reason: 'Duplicate connection'
      });
    }

    // 保存客户端
    clientInfo.name = name;
    this.clients.set(name, clientInfo);
    this.stats.totalClients++;

    logger.info(`客户端 ${name} 已注册，当前在线: ${this.clients.size}`);

    // 发送注册成功响应
    port.postMessage({
      type: SWA.REGISTERED,
      name: name,
      clients: this.getClientNames(),
      timestamp: Date.now()
    });

    // 通知其他客户端有新成员加入
    this.broadcastMessage('system', {
      type: SWA.CLIENT_JOINED,
      name: name,
      totalClients: this.clients.size
    });

    // 监听端口关闭
    this.setupDisconnectHandler(name, port);
  }

  /**
   * 设置断开连接处理
   */
  setupDisconnectHandler(name, port) {
    // 注意：浏览器的 MessagePort 不支持 'close' 事件
    // 我们通过心跳和错误来检测断开
    // 客户端应该主动发送 UNREGISTER 消息
  }

  /**
   * 注销客户端
   */
  unregisterClient(name) {
    if (this.clients.has(name)) {
      this.clients.delete(name);
      logger.info(`客户端 ${name} 已断开，当前在线: ${this.clients.size}`);

      // 通知其他客户端
      this.broadcastMessage('system', {
        type: SWA.CLIENT_LEFT,
        name: name,
        totalClients: this.clients.size
      });
    }
  }

  /**
   * 点对点发送消息
   */
  sendToClient(fromName, toName, data, requestId) {
    const targetClient = this.clients.get(toName);

    if (!targetClient) {
      // 目标客户端不存在
      const senderClient = this.clients.get(fromName);
      if (senderClient) {
        this.sendError(senderClient.port, requestId, `Target client '${toName}' not found`);
      }
      logger.warn(`目标客户端 ${toName} 不存在`);
      return;
    }

    // 转发消息
    try {
      targetClient.port.postMessage({
        from: fromName,
        requestId: requestId,
        data: data,
        timestamp: Date.now()
      });
      logger.info(`消息转发: ${fromName} -> ${toName}`);
    } catch (error) {
      logger.error(`发送消息失败:`, error);
      // 可能端口已关闭，移除客户端
      this.unregisterClient(toName);

      // 通知发送者
      const senderClient = this.clients.get(fromName);
      if (senderClient) {
        this.sendError(senderClient.port, requestId, `Failed to send to '${toName}': ${error.message}`);
      }
    }
  }

  /**
   * 广播消息给所有客户端（除了发送者）
   */
  broadcastMessage(fromName, data, requestId) {
    let successCount = 0;
    let failedClients = [];

    this.clients.forEach((clientInfo, name) => {
      // 不发送给自己
      if (name === fromName) return;

      try {
        clientInfo.port.postMessage({
          from: fromName,
          requestId: requestId,
          data: data,
          timestamp: Date.now(),
          broadcast: true
        });
        successCount++;
      } catch (error) {
        logger.error(`广播到 ${name} 失败:`, error);
        failedClients.push(name);
      }
    });

    // 清理失败的客户端
    failedClients.forEach(name => this.unregisterClient(name));

    logger.info(`广播消息: ${fromName} -> ${successCount} 个客户端`);

    // 如果发送者还在线，通知广播结果
    if (fromName !== 'system') {
      const senderClient = this.clients.get(fromName);
      if (senderClient && requestId) {
        senderClient.port.postMessage({
          type: SWA.BROADCAST_ACK,
          requestId: requestId,
          delivered: successCount,
          failed: failedClients.length
        });
      }
    }
  }

  /**
   * 发送客户端列表
   */
  sendClientList(port, requestId) {
    const clientList = Array.from(this.clients.entries()).map(([name, info]) => ({
      name: name,
      connectedAt: info.connectedAt,
      messageCount: info.messageCount
    }));

    port.postMessage({
      type: SWA.CLIENT_LIST,
      requestId: requestId,
      clients: clientList,
      total: this.clients.size
    });
  }

  /**
   * 发送统计信息
   */
  sendStats(port, requestId) {
    port.postMessage({
      type: SWA.STATS,
      requestId: requestId,
      stats: {
        ...this.stats,
        currentClients: this.clients.size,
        uptime: Date.now() - this.stats.startTime
      }
    });
  }

  /**
   * 发送错误消息
   */
  sendError(port, requestId, message) {
    try {
      port.postMessage({
        type: SWA.ERROR,
        requestId: requestId,
        error: message,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('发送错误消息失败:', error);
    }
  }

  /**
   * 获取所有客户端名称
   */
  getClientNames() {
    return Array.from(this.clients.keys());
  }
}

// 创建服务中心实例
const hub = new SharedWorkerHub();

// 监听新连接
self.onconnect = (event) => {
  logger.info('收到新连接');
  const updateClientName = hub.handleConnect(event);

  // 处理注册消息以获取客户端名称
  const port = event.ports[0];
  const originalOnMessage = port.onmessage;

  port.onmessage = (e) => {
    if (e.data && e.data.type === SWA.REGISTER && e.data.name) {
      updateClientName(e.data.name);
    }
    if (originalOnMessage) {
      originalOnMessage.call(port, e);
    }
  };
};

// 全局错误处理
self.onerror = (error) => {
  logger.error('全局错误:', error);
};

logger.info('shared_worker.js 已加载完成');
