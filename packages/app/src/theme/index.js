/**
 * js 文件下使用这个做类型提示
 * @type {import('naive-ui').GlobalThemeOverrides} a
 */
export const themeOverrides = {
  common: {
    fontSize: "0.875rem", // 部分组件字体大小
    fontSizeMedium: "0.875rem", // 公共字体大小
    textColor: "var(--text-primary)", // 公共字体颜色
    textColorDisabled: "var(--text-disabled)", // 公共字体禁用颜色
    placeholderColor: "var(--ui-placeholder-color)", // 占位字体颜色
    placeholderColorDisabled: "var(--text-disabled)", // 占位字体禁用颜色

    // popoverColor: "yellow",
    invertedColor: "var(--text-inverse)", // 字体反色
    // caretColor: "var(--text-primary)",
    color: "var(--text-primary)", // 公共背景色 ？
    // baseColor: "transparent", // 组件内部分底色？
    // borderColor: "var(--border-color)",
    borderRadius: "6px", // 公共圆角
    cardColor: "var(--ui-modal-bg)", // Card 组件背景色
    modalColor: "var(--ui-modal-bg)", // Modal 组件背景色
  },
  Button: {
    textColor: "var(--text-primary)", // 字体颜色
    // textColorDisabled: "var(--text-disabled)", // 字体禁用颜色
    // textColorPrimary: "var(--text-primary)", // 字体颜色
    border: "1px solid var(--border-color)", // 边框
    textColorError: "var(--color-error)", // type error 字体颜色
    colorError: "var(--color-bg-error)",
    colorHoverError: "var(--color-bg-error-hover)",
    borderError: `1px solid var(--color-bg-error-hover)`,
    borderHoverError: `1px solid var(--color-bg-error)`,
  },
  Input: {
    textColor: "var(--text-primary)", // 字体颜色
    textColorDisabled: "var(--text-disabled)", // 字体禁用颜色
    color: "var(--ui-common-bg)", // 背景色
    colorFocus: "var(--bg-primary)", // 焦点背景色
    colorFocusWarning: "var(--bg-primary)", // 焦点背景色
    colorFocusError: "var(--color-bg-error-focus)", // 焦点背景色
    colorDisabled: "var(--bg-disabled)", // 禁用背景色
    border: "1px solid var(--border-color)", // 边框
    borderDisabled: "1px solid var(--ui-border-box-shadow)", // 边框禁用
  },
  Select: {},
  // 下拉框
  InternalSelection: {
    textColor: "var(--text-primary)", // 字体颜色
    textColorDisabled: "var(--text-disabled)", // 字体禁用颜色
    color: "var(--ui-common-bg)", // 背景色
    colorActive: "var(--bg-primary)", // 点击背景色
    colorDisabled: "var(--bg-disabled)", // 禁用背景色
    border: "1px solid var(--border-color)", // 边框
    borderDisabled: "1px solid var(--ui-border-box-shadow)", // 边框禁用
    arrowColor: "var(--text-disabled)", // icon 颜色
  },
  // 下拉选项
  InternalSelectMenu: {
    color: "var(--interactive-bg-default)", // 背景色
    optionTextColor: "var(--interactive-default)", // 选项字体颜色
    optionColorPending: "var(--interactive-bg-hover)", // 选项 hover 颜色
    optionColorActivePending: "var(--interactive-bg-active)", // 选项 active 颜色
  },
  // Dropdown: {},
  // Menu: {},
  // Tooltip: {},
  Radio: {
    color: "var(--ui-common-bg)", // 背景色
    textColor: "var(--interactive-default)", // 字体颜色
    colorDisabled: "var(--bg-disabled)", // 字体禁用颜色
    dotColorDisabled: "var(--ui-border-box-shadow)", // 选中时内部背景色
    boxShadow: "inset 0 0 0 1px var(--border-color)", // 组件边框颜色
    boxShadowDisabled: "inset 0 0 0 1px var(--ui-border-box-shadow)", // 组件边框颜色
  },
  Checkbox: {
    color: "var(--ui-common-bg)", // 背景色
    textColor: "var(--interactive-default)", // 字体颜色
    colorDisabled: "var(--bg-disabled)", // 字体禁用颜色
    dotColorDisabled: "var(--ui-border-box-shadow)", // 选中时内部背景色
    // boxShadow: "inset 0 0 0 1px var(--ui-border-box-shadow)", // 组件边框颜色
    // boxShadowDisabled: "inset 0 0 0 1px var(--ui-border-box-shadow)", // 组件边框颜色
    border: "1px solid var(--border-color)", // 边框
  },
  Form: {
    labelTextColor: "var(--text-primary)",
  },
  Card: {
    textColor: "var(--text-secondary)", // 字体颜色
    titleTextColor: "var(--text-primary)", // 标题颜色
    boxShadow: "0 0 0 1px var(--border-color)", // 边框颜色
  },
  Modal: {
    // Modal 使用 Card 属性也受 Card 定义接管
    textColor: "var(--text-secondary)", // 字体颜色
    boxShadow: "0 0 0 1px var(--border-color)", // 边框颜色
  },
  Dialog: {
    textColor: "var(--text-secondary)",
  },
  Drawer: {
    color: "var(--ui-drawer-bg)",
    textColor: "var(--text-secondary)",
    titleTextColor: "var(--text-primary)", // 字体颜色
    headerBorderBottom: "1px solid var(--border-color)",
  },
  DrawerContent: {
    textColor: "var(--text-secondary)", // 字体颜色
  },
  Popover: {
    color: "var(--ui-popconfirm-color)", // 背景色
    textColor: "var(--text-secondary)", // 字体颜色
    boxShadow: "var(--ui-popconfirm-shadow)", // 边框颜色
  },
  Tag: {
    colorBordered: "var(--ui-common-bg)", // 背景色
    textColor: "var(--text-primary)", // 字体颜色
    border: "1px solid var(--border-color)", // 边框
    borderRadius: "6px",
  },
  Divider: {
    color: "var(--border-color)", // 线条颜色
  },
};
