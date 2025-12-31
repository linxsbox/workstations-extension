export const RssSourceTypeEnum = {
  XIAOYUZHOU: "xiaoyuzhou",
  KR36: "36Kr",
  // WECHAT: "wechat",
  RSS: "rss",
};

export const RSS_SOURCE_TYPES = [
  {
    label: "小宇宙",
    value: RssSourceTypeEnum.XIAOYUZHOU,
    description: "播客订阅",
    needsUrl: true,
  },
  {
    label: "36Kr",
    value: RssSourceTypeEnum.KR36,
    description: "科技新闻",
    hasPresets: true,
  },
  // {
  //   label: "公众号",
  //   value: RssSourceTypeEnum.WECHAT,
  //   description: "微信公众号",
  //   needsSearch: true,
  // },
  {
    label: "RSS",
    value: RssSourceTypeEnum.RSS,
    description: "标准 RSS 源",
    needsUrl: true,
  },
];

// 36Kr 的预设源
export const KR36_RSS_OPTIONS = [
  {
    label: "文章资讯",
    value: "https://36kr.com/feed-article",
    type: "rss",
    description: "深度文章和行业分析",
  },
  {
    label: "综合资讯",
    value: "https://36kr.com/feed",
    type: "rss",
    description: "全站综合内容",
  },
  {
    label: "最新快讯",
    value: "https://36kr.com/feed-newsflash",
    type: "rss",
    description: "实时科技快讯",
  },
  {
    label: "动态内容",
    value: "https://36kr.com/feed-moment",
    type: "rss",
    description: "行业动态更新",
  },
];
