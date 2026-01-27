/**
 * WebRTC 模块
 * 提供 WebRTC 连接管理和数据通信功能
 */
import { defaultStorage } from "@linxs/toolkit";
import { WEBRTC_ACTIONS, APP_ACTIONS } from "../config/index.js";

/**
 * WebRTC 管理器
 * 负责 WebRTC 连接的生命周期管理
 */
export class WebRTCManager {
  constructor() {
    this.peer = null;
    this.peerId = null;
    this.connections = new Map();
    this.sharedClient = null;

    const { localStorage } = defaultStorage();
    this.local = localStorage;

    this.initSharedClient();
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
    const savedPeerId = await this.local.get("webrtc_peer_id");
    if (savedPeerId) {
      console.log("[WebRTC] 从存储中恢复 Peer ID:", savedPeerId);
      this.peerId = savedPeerId;
      return savedPeerId;
    }

    // 3. 生成新的 Peer ID 并存储
    const newPeerId = "peer-" + Math.random().toString(36).substr(2, 9);
    console.log("[WebRTC] 生成新的 Peer ID:", newPeerId);
    await this.local.set("webrtc_peer_id", newPeerId);
    this.peerId = newPeerId;
    return newPeerId;
  }

  /**
   * 初始化 WebRTC 连接
   */
  async init() {
    try {
      console.log("[WebRTC] 开始初始化...");

      // 获取或创建 Peer ID
      this.peerId = await this.getOrCreatePeerId();

      // 创建 Peer 实例
      this.peer = new Peer(this.peerId, {
        host: "0.peerjs.com",
        port: 443,
        path: "/",
        secure: true,
        debug: 2,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      this.setupPeerListeners();

      return { success: true };
    } catch (error) {
      console.error("[WebRTC] 初始化失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 设置 Peer 事件监听器
   */
  setupPeerListeners() {
    this.peer.on("open", (id) => {
      this.peerId = id;
      console.log("[WebRTC] Peer 已打开, ID:", id);

      chrome.runtime
        .sendMessage({
          module: WEBRTC_ACTIONS.MODULE_NAME,
          action: "READY",
          data: { peerId: id },
        })
        .catch((err) => console.error("[WebRTC] 发送就绪消息失败:", err));
    });

    this.peer.on("connection", (conn) => {
      console.log("[WebRTC] 收到连接请求");
      this.handleConnection(conn);
    });

    this.peer.on("error", (err) => {
      console.error("[WebRTC] 发生错误:", err);

      chrome.runtime
        .sendMessage({
          module: WEBRTC_ACTIONS.MODULE_NAME,
          action: "ERROR",
          data: { error: err.message },
        })
        .catch((e) => console.error("[WebRTC] 发送错误消息失败:", e));
    });
  }

  /**
   * 处理连接
   */
  handleConnection(conn) {
    this.connections.set(conn.peer, conn);

    conn.on("open", () => {
      console.log("[WebRTC] 连接已建立:", conn.peer);
    });

    conn.on("data", async (data) => {
      console.log("[WebRTC] 收到数据:", data);

      if (this.sharedClient) {
        await this.sharedClient.sendTo(APP_ACTIONS.SHARED_NAME, {
          type: WEBRTC_ACTIONS.MODULE_NAME,
          data,
        });
      }
    });

    conn.on("close", () => {
      console.log("[WebRTC] 连接已关闭:", conn.peer);
      this.connections.delete(conn.peer);
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
    return { success: false, error: "连接不存在或未打开" };
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
      connections: Array.from(this.connections.keys()),
    };
  }

  async initSharedClient() {
    try {
      const { createClient } = await import(
        chrome.runtime.getURL("background/shared/shared_worker_client.js")
      );

      console.log("[WebRTC] Shared Client 加载完成");

      this.sharedClient = await createClient(WEBRTC_ACTIONS.MODULE_NAME);

      console.log("[WebRTC] Shared Client：", this.sharedClient);
    } catch (error) {
      this.sharedClient = null;
      console.error("[WebRTC] Shared Client 加载失败", error);
    }
  }
}

/**
 * WebRTC 行为处理器
 * 处理各种 WebRTC 动作
 */
export class WebRTCActionHandler {
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * 处理动作
   */
  async handle({ action, data }) {
    switch (action) {
      case WEBRTC_ACTIONS.GET_PEER_ID:
        return { success: true, peerId: this.manager.peerId || null };

      case WEBRTC_ACTIONS.SEND_DATA:
        return this.manager.sendData(data.targetPeerId, data.data);

      case WEBRTC_ACTIONS.DISCONNECT:
        return this.manager.disconnect();

      case WEBRTC_ACTIONS.GET_STATUS:
        return { success: true, status: this.manager.getStatus() };

      default:
        return { success: false, error: `未知的动作: ${action}` };
    }
  }
}
