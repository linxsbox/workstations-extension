import { Logger } from '@linxs/toolkit';
import {
  WEBRTC_ACTIONS,
  AUDIO_ACTIONS,
  ONNX_ACTIONS,
  SERVICE_NAME,
} from 'pkg-utils/constants';
import MessagingManager from '../modules/messaging.js';
import { WebRTCManager, WebRTCActionHandler } from '../modules/webrtc.js';

const logger = new Logger('Service Offscreen', { showTimestamp: false });

const moduleHandler = new Map();

/**
 * 初始化消息管理器
 */
const messagingManager = new MessagingManager();

/**
 * 注册消息处理器
 */
messagingManager.registerHandlers({
  [SERVICE_NAME.OFFSCREEN]: async (message, sender) => {
    // 解析消息格式
    const { from, to, action, data, timestamp, service } = message;
    logger.info(`Service ${service} 收到消息 ID：`, sender.id);
    logger.info(`from ${from} to ${to}, Action: ${action}`, timestamp);

    let webrtcManager = null;

    switch (to) {
      case WEBRTC_ACTIONS.MODULE_NAME:
        const module = moduleHandler.get(WEBRTC_ACTIONS.MODULE_NAME);
        if (!moduleHandler.get(WEBRTC_ACTIONS.MODULE_NAME)) {
          const webrtcManager = new WebRTCManager();
          moduleHandler.set(
            WEBRTC_ACTIONS.MODULE_NAME,
            new WebRTCActionHandler(webrtcManager)
          );
        }

        return module.handle(message);

      case AUDIO_ACTIONS.MODULE_NAME:
        // TODO: 实现 Audio 模块
        logger.info('收到', from, to, action);

        break;
      case ONNX_ACTIONS.MODULE_NAME:
        // TODO: 实现 Onnx 模块
        logger.info('收到', from, to, action);

        break;
      default:
        break;
    }
  },
});

/**
 * 设置消息监听器
 */
messagingManager.setupListener();
