import { markRaw } from "vue";
import HomePanelView from "@/views/HomePanel/HomePanelView.vue";
import RssPanelView from "@/views/RssPanel/RssPanelView.vue";
import ToolsPanelView from "@/views/ToolsPanel/ToolsPanelView.vue";

import IconHome from "@/components/common/Icons/IconHome.vue";
import IconRss from "@/components/common/Icons/IconRss.vue";
import IconWork from "@/components/common/Icons/IconWork.vue";
import IconMark from "@/components/common/Icons/IconMark.vue";
import IconShare from "@/components/common/Icons/IconShare.vue";

// 面板配置
export const panelConfig = {
  home: {
    id: "home",
    icon: markRaw(IconHome),
    label: "首页",
    component: markRaw(HomePanelView),
  },
  rss: {
    id: "rss",
    icon: markRaw(IconRss),
    label: "RSS",
    component: markRaw(RssPanelView),
  },
  tools: {
    id: "tools",
    icon: markRaw(IconWork),
    label: "工具",
    component: markRaw(ToolsPanelView),
  },
  // favorites: {
  //   id: "favorites",
  //   icon: markRaw(IconMark),
  //   label: "收藏",
  //   component: null, // 待实现
  // },
  // share: {
  //   id: "share",
  //   icon: markRaw(IconShare),
  //   label: "分享",
  //   component: null, // 待实现
  // },
};

// 默认面板
export const DEFAULT_PANEL = "home";

// 获取所有可用的面板 keys
export const getPanelKeys = () => Object.keys(panelConfig);

// 检查面板是否有效
export const isPanelValid = (panelKey) =>
  panelConfig[panelKey] && panelConfig[panelKey].component;
