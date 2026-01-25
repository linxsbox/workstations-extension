/**
 * Notes 应用配置
 */
export const NOTES_CONFIG = {
  // 默认笔记标题
  defaultTitle: '新笔记',
  // 无标题占位文本
  untitledPlaceholder: '无标题',
  // 空内容占位文本
  emptyContentPlaceholder: '无内容',
  // 笔记预览最大长度
  previewMaxLength: 20,
  // 编辑器最小行数
  editorMinRows: 20,
};

/**
 * 分享类型
 */
export const SHARE_TYPE = {
  FULL: 'full', // 整篇文章
  SELECTED: 'selected', // 选中内容
};

/**
 * 分享卡片配置
 */
export const SHARE_CARD_CONFIG = {
  // 单行高度（px）
  lineHeight: 28,
  // 目标行数
  targetLines: 6,
  // 空div宽度（px）- 用于估算单行字符容量
  emptyDivWidth: 372,
  // 目标总宽度（px）- 约6行的字符容量
  targetTotalWidth: 2380,
  // 平均字符宽度（px）- 根据字体大小估算，中文约14px，英文约7px
  avgCharWidth: 14,
};
