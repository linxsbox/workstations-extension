// 设置项类型枚举
export const SettingSectionEnum = {
  GENERAL: "general",
  RSS: "rss",
  NOTIFICATION: "notification",
  ADVANCED: "advanced",
};

export const settingChildKeys = {
  FONTSIZEOPTIONS: "fontSizeOptions",
};

// 设置项配置
export const settingMenus = [
  {
    id: SettingSectionEnum.GENERAL,
    label: "常规设置",
    sections: [
      { title: "主题", items: [] },
      { title: "语言", items: [] },
      {
        title: "字体",
        id: settingChildKeys.FONTSIZEOPTIONS,
        options: [
          { label: "小", value: 14 },
          { label: "默认", value: 16 },
          { label: "大", value: 18 },
          { label: "超大", value: 22 },
        ],
      },
      { title: "菜单习惯", items: [] },
    ],
  },
  {
    id: SettingSectionEnum.NOTIFICATION,
    label: "通知设置",
    sections: [
      { title: "通知类型", items: [] },
      { title: "提醒方式", items: [] },
    ],
  },
  {
    id: SettingSectionEnum.ADVANCED,
    label: "高级设置",
    sections: [
      { title: "缓存管理", items: [] },
      { title: "数据同步", items: [] },
      { title: "快捷键", items: [] },
    ],
  },
];

// 获取配置项子项
export const getSettingChildItems = (sectionId, childId) => {
  const menu = settingMenus.find((menu) => menu.id === sectionId);
  if (!menu) {
    console.warn(`Section ${sectionId} not found`);
    return [];
  }

  const section = menu.sections.find(
    (section) => section.id === childId || section.key === childId
  );
  if (!section) {
    console.warn(`Child ${childId} not found in section ${sectionId}`);
    return [];
  }

  return section.options || [];
};
