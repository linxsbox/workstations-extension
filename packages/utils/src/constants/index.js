// 消息动作配置统一导出
export { APP_ACTIONS } from './app.js';
export { WEBRTC_ACTIONS } from './webrtc.js';
export { AUDIO_ACTIONS, PlayMode } from './audio.js';
export { ONNX_ACTIONS } from './onnx.js';
export { SHARED_WORKER_ACTIONS } from './shared-worker.js';

// 服务名导出
export const SERVICE_NAME = {
  SERVICE_WORKER: 'SERVICE_WORKER',
  SHARED_WORKER: 'SHARED_WORKER',
  OFFSCREEN: 'OFFSCREEN',
};
