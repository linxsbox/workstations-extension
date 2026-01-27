/**
 * Onnx 模块消息动作配置
 */
export const ONNX_ACTIONS = {
  /** 模块名称 */
  MODULE_NAME: 'ONNX',
  SHARED_NAME: 'SHARED_ONNX',
  /** 初始化 ONNX Runtime */
  INIT: 'INIT',
  /** 加载模型 */
  LOAD_MODEL: 'LOAD_MODEL',
  /** 运行推理 */
  RUN_INFERENCE: 'RUN_INFERENCE',
  /** 推理进行中 */
  INFERENCE_RUNNING: 'INFERENCE_RUNNING',
  /** 推理结束 */
  INFERENCE_COMPLETED: 'INFERENCE_COMPLETED',
  /** 获取运行状态 */
  GET_STATUS: 'GET_STATUS'
};
