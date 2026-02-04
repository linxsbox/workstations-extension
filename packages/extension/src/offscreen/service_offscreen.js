import { Logger } from '@linxs/toolkit';
import {
  WEBRTC_ACTIONS,
  AUDIO_ACTIONS,
  ONNX_ACTIONS,
  SERVICE_NAME,
} from 'pkg-utils/constants';
import MessagingManager from '../modules/messaging.js';
import { WebRTCActionHandler } from '../modules/webrtc.js';

const logger = new Logger('Service Offscreen');

/**
 * 模块处理器管理
 * 在外层管理所有模块实例
 */
const moduleHandlers = new Map();

/**
 * 初始化消息管理器
 */
const messagingManager = new MessagingManager();

/**
 * 注册消息处理器
 */
messagingManager.registerHandlers({
  [SERVICE_NAME.OFFSCREEN]: async (message, sender) => {
    const { from, to, action, data, timestamp, service } = message;

    logger.info(`收到消息 - from: ${from}, to: ${to}, action: ${action}, service: ${service}`);

    try {
      // 根据 to 字段路由到对应模块
      let handler = moduleHandlers.get(to);

      // 如果模块未创建，创建新的 handler
      if (!handler) {
        logger.info(`创建新的模块 handler: ${to}`);

        switch (to) {
          case WEBRTC_ACTIONS.MODULE_NAME:
            handler = new WebRTCActionHandler();
            moduleHandlers.set(to, handler);
            break;

          case AUDIO_ACTIONS.MODULE_NAME:
            // TODO: 实现 Audio 模块
            logger.warn('Audio 模块暂未实现');
            return { success: false, error: 'Audio 模块暂未实现' };

          case ONNX_ACTIONS.MODULE_NAME:
            // TODO: 实现 ONNX 模块
            logger.warn('ONNX 模块暂未实现');
            return { success: false, error: 'ONNX 模块暂未实现' };

          default:
            logger.error(`未知的模块: ${to}`);
            return { success: false, error: `未知的模块: ${to}` };
        }
      }

      // 调用 handler 处理消息
      const result = await handler.handle({ action, data });
      logger.info(`处理结果:`, result);

      return result;
    } catch (error) {
      logger.error(`处理消息失败:`, error);
      return { success: false, error: error.message };
    }
  },
});

/**
 * 设置消息监听器
 */
messagingManager.setupListener();
