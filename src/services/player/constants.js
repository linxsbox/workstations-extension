/**
 * 播放器位置状态
 */
export const PLAYER_LOCATION = {
  INDEX: 'index',           // index.html 本地播放
  OFFSCREEN: 'offscreen',   // Offscreen Document 后台播放
  NONE: 'none',             // 无播放
};

/**
 * 消息类型定义
 */
export const MESSAGE_TYPES = {
  // 播放控制
  PLAY: 'PLAYER_PLAY',
  PAUSE: 'PLAYER_PAUSE',
  STOP: 'PLAYER_STOP',
  NEXT: 'PLAYER_NEXT',
  PREVIOUS: 'PLAYER_PREVIOUS',
  SEEK: 'PLAYER_SEEK',
  SET_VOLUME: 'PLAYER_SET_VOLUME',
  SET_PLAYBACK_RATE: 'PLAYER_SET_PLAYBACK_RATE',

  // 播放交接
  HANDOVER_TO_OFFSCREEN: 'HANDOVER_TO_OFFSCREEN',
  HANDOVER_TO_INDEX: 'HANDOVER_TO_INDEX',

  // 状态查询
  GET_PLAYER_STATE: 'GET_PLAYER_STATE',
  PLAYER_STATE_RESPONSE: 'PLAYER_STATE_RESPONSE',

  // Offscreen 管理
  CREATE_OFFSCREEN: 'CREATE_OFFSCREEN',
  CLOSE_OFFSCREEN: 'CLOSE_OFFSCREEN',
  OFFSCREEN_READY: 'OFFSCREEN_READY',

  // 播放队列操作
  ADD_TO_QUEUE: 'PLAYER_ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'PLAYER_REMOVE_FROM_QUEUE',
  CLEAR_QUEUE: 'PLAYER_CLEAR_QUEUE',
};

/**
 * Offscreen Document 原因
 */
export const OFFSCREEN_REASON = 'AUDIO_PLAYBACK';

/**
 * Offscreen Document URL
 */
export const OFFSCREEN_DOCUMENT_PATH = '/offscreen/player.html';
