export const RssSourceTypeEnum = {
  XIAOYUZHOU: "xiaoyuzhou",
  PRESET: "preset",
  RSS: "rss",
};

// RSS 更新冷却时间配置
export const RSS_UPDATE_COOLDOWN = 5 * 60 * 1000; // 5分钟
export const RSS_BATCH_UPDATE_INTERVAL = 1; // 批量更新间隔（小时）

export const RSS_SOURCE_TYPES = [
  {
    label: "小宇宙",
    value: RssSourceTypeEnum.XIAOYUZHOU,
    description: "播客订阅",
    needsUrl: true,
  },
  {
    label: "可用源",
    value: RssSourceTypeEnum.PRESET,
    description: "预设的优质 RSS 源",
    hasPresets: true,
  },
  {
    label: "RSS",
    value: RssSourceTypeEnum.RSS,
    description: "标准 RSS 源",
    needsUrl: true,
  },
];

// 预设的优质 RSS 源
export const PRESET_RSS_OPTIONS = [
  // 科技类
  {
    label: "少数派",
    value: "https://sspai.com/feed",
    category: "科技",
  },
  {
    label: "虎嗅网",
    value: "https://www.huxiu.com/rss/0.xml",
    category: "科技",
  },
  {
    label: "机器之心",
    value: "https://www.jiqizhixin.com/rss",
    category: "AI",
  },
  {
    label: "36Kr - 文章资讯",
    value: "https://36kr.com/feed-article",
    category: "科技",
  },
  {
    label: "36Kr - 综合资讯",
    value: "https://36kr.com/feed",
    category: "科技",
  },
  {
    label: "36Kr - 最新快讯",
    value: "https://36kr.com/feed-newsflash",
    category: "科技",
  },
  {
    label: "36Kr - 动态内容",
    value: "https://36kr.com/feed-moment",
    category: "技术",
  },
  // 技术类
  {
    label: "阮一峰的网络日志",
    value: "https://www.ruanyifeng.com/blog/atom.xml",
    category: "技术",
  },
  // 财经投资类
  {
    label: "雪球 - 今日话题",
    value: "https://xueqiu.com/hots/topic/rss",
    category: "财经投资",
  },
];
