/**
 * 卡片控制面板状态管理
 */
import { SHARE_CARD_TYPE } from '@/constants/shareCard';

/**
 * 卡片控制状态默认值
 */
export const DEFAULT_CARD_CONTROL_STATE = {
  // 签名相关
  signature: '',
  textAlign: 'left',
  isSignatureShow: true,
  // 二维码相关
  qrcode: '',
  isQrcodeShow: true,
  // 卡片类型
  cardType: SHARE_CARD_TYPE.IMAGE
}

/**
 * 创建卡片控制状态
 * @returns {Object} 卡片控制状态对象
 */
export function createCardControlState() {
  return { ...DEFAULT_CARD_CONTROL_STATE }
}
