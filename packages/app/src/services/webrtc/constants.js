/**
 * WebRTC 服务常量配置
 */

// WebRTC 配置
export const WEBRTC_CONFIG = {
  // 移动端页面 URL
  // 开发环境：使用本地地址
  MOBILE_PAGE_URL_DEV: 'http://localhost:5173/mobile',

  // 生产环境：使用 GitHub Pages（需要部署后修改）
  MOBILE_PAGE_URL_PROD: 'https://linxsbox.github.io/workstations-mobile',

  // PeerJS 配置
  PEER_CONFIG: {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 2,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
  },

  // 会话配置
  SESSION_TIMEOUT: 5 * 60 * 1000, // 5 分钟

  // Peer ID 前缀
  PEER_ID_PREFIX: 'ext-',
};

// 连接状态
export const CONNECTION_STATUS = {
  IDLE: 'idle',           // 未初始化
  INITIALIZING: 'initializing', // 初始化中
  READY: 'ready',         // 就绪（等待连接）
  CONNECTING: 'connecting', // 连接中
  CONNECTED: 'connected',  // 已连接
  DISCONNECTED: 'disconnected', // 已断开
  ERROR: 'error',         // 错误
};

// 消息类型
export const MESSAGE_TYPE = {
  // 手机端 → 扩展端
  NOTE: 'NOTE',           // 笔记内容
  PING: 'PING',           // 心跳检测

  // 扩展端 → 手机端
  WELCOME: 'WELCOME',     // 欢迎消息
  SUCCESS: 'SUCCESS',     // 操作成功
  ERROR: 'ERROR',         // 操作失败
  PONG: 'PONG',           // 心跳响应
};

// Storage Keys
export const STORAGE_KEYS = {
  WEBRTC_PEER_ID: 'webrtc_peer_id',
  WEBRTC_QR_DATA: 'webrtc_qr_data',
  WEBRTC_STATUS: 'webrtc_status',
  WEBRTC_ERROR: 'webrtc_error',
};

// SessionStorage Keys
export const SESSION_KEYS = {
  PEER_ID: 'webrtc_peer_id',
  QR_DATA: 'webrtc_qr_data',
  CREATED_AT: 'webrtc_created_at',
};
