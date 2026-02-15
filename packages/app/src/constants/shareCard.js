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
  MIXED: 'mixed',
}

/**
 * 卡片类型标签映射
 */
export const SHARE_CARD_TYPE_LABELS = {
  [SHARE_CARD_TYPE.IMAGE]: '图片卡片',
  [SHARE_CARD_TYPE.PHONE]: '手机卡片',
  [SHARE_CARD_TYPE.PLAYER]: '播放器卡片',
  [SHARE_CARD_TYPE.TEXT]: '文字卡片',
  [SHARE_CARD_TYPE.MIXED]: '混合卡片',
}

/**
 * 卡片类型列表
 */
export const SHARE_CARD_TYPE_LIST = [
  { value: SHARE_CARD_TYPE.IMAGE, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.IMAGE] },
  { value: SHARE_CARD_TYPE.PLAYER, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.PLAYER] },
  { value: SHARE_CARD_TYPE.PHONE, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.PHONE] },
  { value: SHARE_CARD_TYPE.TEXT, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.TEXT] },
  { value: SHARE_CARD_TYPE.MIXED, label: SHARE_CARD_TYPE_LABELS[SHARE_CARD_TYPE.MIXED] },
]

/**
 * 卡片分组类型枚举
 */
export const CARD_GROUP_TYPE = {
  MUSIC: 'music',
  TEXT: 'text',
  MIXED: 'mixed',
}

/**
 * 卡片类型分组
 * 用于根据业务场景限制可选的卡片类型
 */
export const CARD_TYPE_GROUPS = {
  // 音乐/媒体类卡片
  [CARD_GROUP_TYPE.MUSIC]: [
    SHARE_CARD_TYPE.IMAGE,
    SHARE_CARD_TYPE.PLAYER,
    SHARE_CARD_TYPE.PHONE,
  ],
  // 文本类卡片
  [CARD_GROUP_TYPE.TEXT]: [
    SHARE_CARD_TYPE.TEXT,
  ],
  // 混合卡片
  [CARD_GROUP_TYPE.MIXED]: [
    SHARE_CARD_TYPE.MIXED,
  ],
}

/**
 * 根据卡片分组获取对应的卡片类型列表
 * @param {Array<string>} groups - 卡片分组数组，如 ['music', 'text']
 * @returns {Array} 过滤后的卡片类型列表
 */
export const getCardTypesByGroups = (groups) => {
  // 如果没有指定分组，返回全部类型
  if (!groups || groups.length === 0) {
    return SHARE_CARD_TYPE_LIST
  }

  // 收集所有分组中的类型
  const types = new Set()
  groups.forEach((group) => {
    const groupTypes = CARD_TYPE_GROUPS[group] || []
    groupTypes.forEach((type) => types.add(type))
  })

  // 过滤并保持原有顺序
  return SHARE_CARD_TYPE_LIST.filter((item) => types.has(item.value))
}
