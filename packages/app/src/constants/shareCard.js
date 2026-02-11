/**
 * 分享卡片类型常量
 */

/**
 * 分享卡片类型枚举
 */
export const SHARE_CARD_TYPE = {
  IMAGE: 'image',
  PHONE: 'phone',
  PLAYER: 'player',
  TEXT: 'text',
  IMAGE_TEXT: 'image_text',
}

/**
 * 卡片类型标签映射
 */
export const SHARE_CARD_TYPE_LABELS = {
  [SHARE_CARD_TYPE.IMAGE]: '图片卡片',
  [SHARE_CARD_TYPE.PHONE]: '手机卡片',
  [SHARE_CARD_TYPE.PLAYER]: '播放器卡片',
  [SHARE_CARD_TYPE.TEXT]: '文字卡片',
  [SHARE_CARD_TYPE.IMAGE_TEXT]: '图文卡片',
}

/**
 * 卡片类型列表
 */
export const SHARE_CARD_TYPE_LIST = [
  { value: SHARE_CARD_TYPE.IMAGE, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.IMAGE] },
  { value: SHARE_CARD_TYPE.PLAYER, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.PLAYER] },
  { value: SHARE_CARD_TYPE.PHONE, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.PHONE] },
  { value: SHARE_CARD_TYPE.TEXT, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.TEXT] },
  { value: SHARE_CARD_TYPE.IMAGE_TEXT, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.IMAGE_TEXT] },
]
