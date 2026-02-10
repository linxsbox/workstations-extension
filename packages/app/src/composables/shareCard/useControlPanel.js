/**
 * 卡片控制面板状态管理
 */

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
}

/**
 * 创建卡片控制状态
 * @returns {Object} 卡片控制状态对象
 */
export function createCardControlState() {
  return { ...DEFAULT_CARD_CONTROL_STATE }
}
