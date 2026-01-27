/**
 * Audio 模块消息动作配置
 */
export const AUDIO_ACTIONS = {
  /** 模块名称 */
  MODULE_NAME: 'AUDIO',
  SHARED_NAME: 'SHARED_AUDIO',
  /** 初始化音频模块 */
  INIT: 'INIT',
  /** 播放音频 */
  PLAY: 'PLAY',
  /** 暂停播放 */
  PAUSE: 'PAUSE',
  /** 停止播放 */
  STOP: 'STOP',
  /** 下一首 */
  NEXT: 'NEXT',
  /** 上一首 */
  PREVIOUS: 'PREVIOUS',
  /** 设置播放模式 */
  SET_MODE: 'SET_MODE',
  /** 设置音量 */
  SET_VOLUME: 'SET_VOLUME',
  /** 获取播放状态 */
  GET_STATUS: 'GET_STATUS'
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
