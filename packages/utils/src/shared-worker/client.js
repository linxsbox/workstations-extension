/**
 * SharedWorker 客户端封装
 * 提供简单易用的 API 来与 SharedWorker 通信
 */

export class SharedWorkerClient {
  constructor(clientName, workerPath = 'shared_worker.js') {
    this.clientName = clientName;
    this.workerPath = workerPath;
    this.worker = null;
    this.port = null;

    // 请求管理
    this.pendingRequests = new Map();
    this.requestId = 0;

    // 消息处理器
    this.messageHandlers = new Map();

    // 事件监听器
    this.eventListeners = {
      connected: [],
      disconnected: [],
      clientJoined: [],
      clientLeft: [],
      error: []
    };

    // 连接状态
    this.isConnected = false;
    this.isRegistered = false;

    // 心跳
    this.heartbeatInterval = null;
    this.heartbeatTimeout = 5000;
  }

  /**
   * 连接到 SharedWorker
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        // 创建 SharedWorker 连接
        this.worker = new SharedWorker(this.workerPath);
        this.port = this.worker.port;

        // 设置消息监听
        this.port.onmessage = (e) => this._handleMessage(e.data);
        this.port.onmessageerror = (e) => {
          console.error('[SharedWorkerClient] 消息错误:', e);
          this._emit('error', { type: 'message_error', error: e });
        };

        // 启动端口
        this.port.start();
        this.isConnected = true;

        // 注册客户端
        this._register()
          .then(() => {
            console.log(`[SharedWorkerClient] ${this.clientName} 已连接并注册`);
            this._emit('connected', { clientName: this.clientName });
            this._startHeartbeat();
            resolve(this);
          })
          .catch(reject);

      } catch (error) {
        console.error('[SharedWorkerClient] 连接失败:', error);
        this._emit('error', { type: 'connection_error', error });
        reject(error);
      }
    });
  }

  /**
   * 注册客户端
   */
  _register() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Registration timeout'));
      }, 5000);

      // 监听注册响应
      const onRegistered = (msg) => {
        if (msg.type === 'REGISTERED') {
          clearTimeout(timeout);
          this.isRegistered = true;
          resolve(msg);
        }
      };

      // 临时监听
      const originalHandler = this.port.onmessage;
      this.port.onmessage = (e) => {
        onRegistered(e.data);
        originalHandler?.call(this.port, e);
      };

      // 发送注册消息
      this.port.postMessage({
        type: 'REGISTER',
        name: this.clientName
      });
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    this._stopHeartbeat();

    if (this.port) {
      // 发送注销消息（可选）
      try {
        this.port.postMessage({
          type: 'UNREGISTER'
        });
      } catch (error) {
        console.warn('[SharedWorkerClient] 发送注销消息失败:', error);
      }

      this.port.close();
      this.port = null;
    }

    this.worker = null;
    this.isConnected = false;
    this.isRegistered = false;

    this._emit('disconnected', { clientName: this.clientName });
    console.log(`[SharedWorkerClient] ${this.clientName} 已断开连接`);
  }

  /**
   * 发送点对点消息（返回 Promise）
   */
  sendTo(targetClient, data, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.isRegistered) {
        reject(new Error('Not connected or registered'));
        return;
      }

      const reqId = this.requestId++;

      // 保存请求
      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new Error(`Request timeout: ${targetClient}`));
      }, timeout);

      this.pendingRequests.set(reqId, { resolve, reject, timer });

      // 发送消息
      this.port.postMessage({
        to: targetClient,
        requestId: reqId,
        data: data
      });
    });
  }

  /**
   * 广播消息给所有客户端
   */
  broadcast(data) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.isRegistered) {
        reject(new Error('Not connected or registered'));
        return;
      }

      const reqId = this.requestId++;

      this.pendingRequests.set(reqId, { resolve, reject });

      this.port.postMessage({
        broadcast: true,
        requestId: reqId,
        data: data
      });
    });
  }

  /**
   * 注册消息处理器（接收来自其他客户端的请求）
   */
  onMessage(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * 移除消息处理器
   */
  offMessage(messageType) {
    this.messageHandlers.delete(messageType);
  }

  /**
   * 获取在线客户端列表
   */
  async getClients() {
    return new Promise((resolve, reject) => {
      const reqId = this.requestId++;

      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new Error('Get clients timeout'));
      }, 5000);

      this.pendingRequests.set(reqId, { resolve, reject, timer });

      this.port.postMessage({
        type: 'GET_CLIENTS',
        requestId: reqId
      });
    });
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    return new Promise((resolve, reject) => {
      const reqId = this.requestId++;

      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new Error('Get stats timeout'));
      }, 5000);

      this.pendingRequests.set(reqId, { resolve, reject, timer });

      this.port.postMessage({
        type: 'GET_STATS',
        requestId: reqId
      });
    });
  }

  /**
   * 发送心跳
   */
  async ping() {
    return new Promise((resolve, reject) => {
      const reqId = this.requestId++;
      const startTime = Date.now();

      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        reject(new Error('Ping timeout'));
      }, 3000);

      this.pendingRequests.set(reqId, {
        resolve: (data) => {
          const latency = Date.now() - startTime;
          resolve({ ...data, latency });
        },
        reject,
        timer
      });

      this.port.postMessage({
        type: 'PING',
        requestId: reqId
      });
    });
  }

  /**
   * 注册事件监听器
   */
  on(event, listener) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
  }

  /**
   * 移除事件监听器
   */
  off(event, listener) {
    if (this.eventListeners[event]) {
      const index = this.eventListeners[event].indexOf(listener);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  _emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[SharedWorkerClient] 事件监听器错误 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 处理接收到的消息
   */
  _handleMessage(msg) {
    // 处理系统消息
    if (msg.type === 'CLIENT_JOINED') {
      this._emit('clientJoined', msg);
      return;
    }

    if (msg.type === 'CLIENT_LEFT') {
      this._emit('clientLeft', msg);
      return;
    }

    if (msg.type === 'DISCONNECTED') {
      this._emit('disconnected', msg);
      this.disconnect();
      return;
    }

    // 处理响应（完成 Promise）
    if (msg.requestId !== undefined && this.pendingRequests.has(msg.requestId)) {
      const { resolve, reject, timer } = this.pendingRequests.get(msg.requestId);
      clearTimeout(timer);
      this.pendingRequests.delete(msg.requestId);

      if (msg.type === 'ERROR') {
        reject(new Error(msg.error));
      } else if (msg.type === 'CLIENT_LIST') {
        resolve(msg.clients);
      } else if (msg.type === 'STATS') {
        resolve(msg.stats);
      } else if (msg.type === 'PONG') {
        resolve(msg);
      } else if (msg.type === 'BROADCAST_ACK') {
        resolve(msg);
      } else {
        resolve(msg.data);
      }
      return;
    }

    // 处理来自其他客户端的请求
    if (msg.from && msg.data) {
      const messageType = msg.data.type;
      const handler = this.messageHandlers.get(messageType);

      if (handler) {
        Promise.resolve(handler(msg.data, msg.from))
          .then(result => {
            // 自动回复
            if (msg.requestId !== undefined) {
              this.port.postMessage({
                to: msg.from,
                requestId: msg.requestId,
                data: result
              });
            }
          })
          .catch(error => {
            console.error(`[SharedWorkerClient] 处理器错误 (${messageType}):`, error);
            // 发送错误响应
            if (msg.requestId !== undefined) {
              this.port.postMessage({
                to: msg.from,
                requestId: msg.requestId,
                type: 'ERROR',
                error: error.message
              });
            }
          });
      } else {
        console.warn(`[SharedWorkerClient] 未处理的消息类型: ${messageType}`);
      }
    }
  }

  /**
   * 启动心跳
   */
  _startHeartbeat() {
    this._stopHeartbeat();

    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        console.error('[SharedWorkerClient] 心跳失败:', error);
        this._emit('error', { type: 'heartbeat_failed', error });
      }
    }, this.heartbeatTimeout);
  }

  /**
   * 停止心跳
   */
  _stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

/**
 * 创建并连接客户端的便捷函数
 */
export async function createClient(clientName, workerPath) {
  const client = new SharedWorkerClient(clientName, workerPath);
  await client.connect();
  return client;
}
