import { SETTING_TYPES } from './types.js'
import IconBrightnessAuto from '@/components/common/Icons/IconBrightnessAuto.vue'
import IconBrightnessDark from '@/components/common/Icons/IconBrightnessDark.vue'
import IconBrightnessLight from '@/components/common/Icons/IconBrightnessLight.vue'

// 设置项分类枚举
export const SettingSectionEnum = {
  GENERAL: "general",
  NOTIFICATION: "notification",
  ADVANCED: "advanced",
}

/**
 * 设置项 Schema 配置
 *
 * Schema 结构：
 * - id: 唯一标识
 * - label: 显示名称
 * - icon: 图标组件名（可选）
 * - sections: 包含的设置项列表
 *   - id: 设置项唯一标识
 *   - title: 设置项标题
 *   - type: 设置项类型（来自 SETTING_TYPES）
 *   - storeKey: 绑定的 store 字段名
 *   - action: 绑定的 store action 名
 *   - enabled: 是否启用（默认 true）
 *   - placeholder: 未启用时显示的占位文本
 *   - description: 设置项描述（可选）
 *   - options: 选项列表（Radio/Select 类型必需）
 *   - component: 自定义组件路径（Custom 类型必需）
 *   - props: 传递给组件的 props（可选）
 */
export const settingSchema = [
  {
    id: SettingSectionEnum.GENERAL,
    label: '常规设置',
    icon: 'IconSettings',
    sections: [
      {
        id: 'theme',
        title: '主题模式',
        type: SETTING_TYPES.RADIO,
        storeKey: 'themeMode',
        action: 'setThemeMode',
        description: '选择应用的主题外观',
        options: [
          {
            label: '跟随系统',
            value: 'system',
            icon: IconBrightnessAuto,
            description: '自动跟随系统主题设置'
          },
          {
            label: '明亮',
            value: 'light',
            icon: IconBrightnessLight,
            description: '使用明亮主题'
          },
          {
            label: '深色',
            value: 'dark',
            icon: IconBrightnessDark,
            description: '使用深色主题'
          },
        ],
      },
      {
        id: 'fontSize',
        title: '字体大小',
        type: SETTING_TYPES.RADIO,
        storeKey: 'fontSize',
        action: 'setFontSize',
        description: '调整界面文字大小',
        options: [
          { label: '小', value: 14, description: '14px' },
          { label: '默认', value: 16, description: '16px' },
          { label: '大', value: 18, description: '18px' },
          { label: '超大', value: 22, description: '22px' },
        ],
      },
      {
        id: 'language',
        title: '语言',
        type: SETTING_TYPES.SELECT,
        storeKey: 'language',
        action: 'setLanguage',
        enabled: false,
        placeholder: '多语言功能开发中，敬请期待...',
        options: [
          { label: '简体中文', value: 'zh-CN' },
          { label: 'English', value: 'en-US' },
        ],
      },
    ],
  },
  {
    id: SettingSectionEnum.NOTIFICATION,
    label: '通知设置',
    icon: 'IconMark',
    sections: [
      {
        id: 'notificationType',
        title: '通知类型',
        type: SETTING_TYPES.RADIO,
        storeKey: 'notificationType',
        action: 'setNotificationType',
        enabled: false,
        placeholder: '通知功能开发中...',
        options: [
          { label: '全部通知', value: 'all' },
          { label: '仅重要通知', value: 'important' },
          { label: '关闭通知', value: 'none' },
        ],
      },
      {
        id: 'soundEnabled',
        title: '提示音',
        type: SETTING_TYPES.SWITCH,
        storeKey: 'soundEnabled',
        action: 'setSoundEnabled',
        enabled: false,
        placeholder: '提示音功能开发中...',
      },
    ],
  },
  {
    id: SettingSectionEnum.ADVANCED,
    label: '高级设置',
    icon: 'IconExtension',
    sections: [
      {
        id: 'shortcuts',
        title: '快捷键',
        type: SETTING_TYPES.CUSTOM,
        component: '@/components/dialogs/SettingDialog/components/Children/ShortcutsTable.vue',
        description: '系统所有可用的快捷键',
      },
      {
        id: 'cache',
        title: '缓存管理',
        type: SETTING_TYPES.CUSTOM,
        enabled: false,
        placeholder: '缓存管理功能规划中，将支持查看和清理缓存数据',
      },
      {
        id: 'apiKey',
        title: 'API Key',
        type: SETTING_TYPES.CUSTOM,
        component: '@/components/dialogs/SettingDialog/components/Children/APIKeyForm.vue',
        description: '配置第三方服务的 API 密钥',
      },
      {
        id: 'configManagement',
        title: '配置管理',
        type: SETTING_TYPES.CUSTOM,
        component: '@/components/dialogs/SettingDialog/components/Children/ConfigManagement.vue',
        description: '导入或导出应用配置数据',
      },
    ],
  },
]

/**
 * 根据 section ID 获取配置
 */
export function getSettingSectionConfig(sectionId) {
  return settingSchema.find(section => section.id === sectionId)
}

/**
 * 根据 section ID 和 item ID 获取设置项配置
 */
export function getSettingItemConfig(sectionId, itemId) {
  const section = getSettingSectionConfig(sectionId)
  if (!section) return null
  return section.sections.find(item => item.id === itemId)
}

// 导出旧的 API 以保持向后兼容（后续可以移除）
export const settingMenus = settingSchema
