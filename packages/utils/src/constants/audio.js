/**
 * Audio 模块消息动作配置
 */
export const AUDIO_ACTIONS = {
  /** 模块名称 */
  MODULE_NAME: 'AUDIO',
  SHARED_NAME: 'SHARED_AUDIO',

  /** 动作类型 */
  INIT: 'INIT',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
  NEXT: 'NEXT',
  PREVIOUS: 'PREVIOUS',
  SET_MODE: 'SET_MODE',
  SET_VOLUME: 'SET_VOLUME',
  GET_STATUS: 'GET_STATUS',
};

/**
 * 播放模式枚举
 */
export const PlayMode = {
  /** 顺序播放：播到最后一首则停止 */
  SEQUENTIAL: 'sequential',
  /** 循环播放：播到最后回到开头 */
  LOOP: 'loop',
  /** 随机播放：随机顺序播放 */
  RANDOM: 'random',
  /** 单曲循环：重复播放当前曲目 */
  SINGLE: 'single',
};
