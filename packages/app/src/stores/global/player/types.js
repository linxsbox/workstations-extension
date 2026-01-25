/**
 * 播放器相关的类型和枚举定义
 */

/**
 * 播放器视图模式枚举
 */
export const ViewMode = {
  /** 列表模式：标准列表布局，包含进度条和播放列表 */
  LIST: 'list',
  /** 标准模式：沉浸式体验，大封面背景 + 歌词滚动 */
  STANDARD: 'standard',
};

/**
 * 播放模式枚举
 */
export const PlayMode = {
  /** 顺序播放：播到最后一首则停止 */
  SEQUENTIAL: 'sequential',
  /** 循环播放：播到最后回到开头 */
  LOOP: 'loop',
  /** 随机播放：随机顺序播放 */
  RANDOM: 'random',
  /** 单曲循环：重复播放当前曲目 */
  SINGLE: 'single',
};

/**
 * 播放模式的显示文本和图标
 */
export const PlayModeConfig = {
  [PlayMode.SEQUENTIAL]: {
    label: '顺序播放',
    icon: '⃗',
    next: PlayMode.LOOP,
  },
  [PlayMode.LOOP]: {
    label: '循环播放',
    icon: '↻',
    next: PlayMode.RANDOM,
  },
  [PlayMode.RANDOM]: {
    label: '随机播放',
    icon: '🔀',
    next: PlayMode.SINGLE,
  },
  [PlayMode.SINGLE]: {
    label: '单曲循环',
    icon: '🔁',
    next: PlayMode.SEQUENTIAL,
  },
};

/**
 * 播放列表数据结构
 */
export class Playlist {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.name = data.name || 'Untitled Playlist';
    this.description = data.description || '';
    this.cover = data.cover || '';
    this.tracks = data.tracks || [];
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * 添加轨道
   */
  addTrack(track) {
    if (!this.tracks.some(t => t.id === track.id)) {
      this.tracks.push({
        ...track,
        id: track.id || generateId(),
      });
      this.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 移除轨道
   */
  removeTrack(trackId) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index > -1) {
      this.tracks.splice(index, 1);
      this.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 清空轨道
   */
  clear() {
    this.tracks = [];
    this.updatedAt = Date.now();
  }

  /**
   * 获取轨道数
   */
  getTrackCount() {
    return this.tracks.length;
  }

  /**
   * 获取总时长（秒）
   */
  getDuration() {
    return this.tracks.reduce((sum, track) => {
      return sum + (track.duration || 0);
    }, 0);
  }
}

/**
 * 播放队列数据结构
 */
export class PlayQueue {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.tracks = data.tracks || [];
    this.currentIndex = data.currentIndex || 0;
    this.mode = data.mode || PlayMode.LOOP;
    this.randomOrder = data.randomOrder || []; // 用于随机模式保存随机播放顺序（TrackId数组）
    this.currentRandomIndex = data.currentRandomIndex || 0; // 当前在随机顺序中的位置
  }

  /**
   * 从播放列表初始化队列
   */
  static fromPlaylist(playlist, mode = PlayMode.LOOP) {
    const queue = new PlayQueue({
      tracks: [...playlist.tracks],
      mode,
    });

    return queue;
  }

  /**
   * 获取当前轨道
   */
  getCurrentTrack() {
    return this.tracks[this.currentIndex] || null;
  }

  /**
   * 获取下一首轨道索引
   */
  getNextIndex() {
    const length = this.tracks.length;
    if (length === 0) return -1;

    switch (this.mode) {
      case PlayMode.SEQUENTIAL:
        return this.currentIndex < length - 1 ? this.currentIndex + 1 : -1;

      case PlayMode.LOOP:
        return (this.currentIndex + 1) % length;

      case PlayMode.RANDOM:
        // 如果没有随机顺序或长度不匹配，生成一个
        if (this.randomOrder.length === 0 || this.randomOrder.length !== length) {
          this.generateRandomOrder();
        }
        // 移动到随机顺序中的下一个位置
        this.currentRandomIndex = (this.currentRandomIndex + 1) % this.randomOrder.length;
        // 获取下一个 TrackId
        const nextTrackId = this.randomOrder[this.currentRandomIndex];
        // 找到该 TrackId 在 tracks 中的索引
        const nextIndex = this.tracks.findIndex(t => t.id === nextTrackId);
        return nextIndex >= 0 ? nextIndex : -1;

      case PlayMode.SINGLE:
        return this.currentIndex;

      default:
        return (this.currentIndex + 1) % length;
    }
  }

  /**
   * 生成随机播放顺序（Fisher-Yates 洗牌算法）
   */
  generateRandomOrder() {
    const length = this.tracks.length;
    if (length === 0) {
      this.randomOrder = [];
      this.currentRandomIndex = 0;
      return;
    }

    // 创建 TrackId 数组
    this.randomOrder = this.tracks.map(track => track.id);

    // Fisher-Yates 洗牌算法
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.randomOrder[i], this.randomOrder[j]] = [this.randomOrder[j], this.randomOrder[i]];
    }

    // 重置随机播放位置
    this.currentRandomIndex = 0;
  }

  /**
   * 获取上一首轨道索引
   */
  getPreviousIndex() {
    const length = this.tracks.length;
    if (length === 0) return -1;

    switch (this.mode) {
      case PlayMode.SEQUENTIAL:
        return this.currentIndex > 0 ? this.currentIndex - 1 : -1;

      case PlayMode.LOOP:
        return this.currentIndex > 0 ? this.currentIndex - 1 : length - 1;

      case PlayMode.RANDOM:
        // 如果没有随机顺序或长度不匹配，生成一个
        if (this.randomOrder.length === 0 || this.randomOrder.length !== length) {
          this.generateRandomOrder();
        }
        // 移动到随机顺序中的上一个位置
        this.currentRandomIndex = this.currentRandomIndex > 0
          ? this.currentRandomIndex - 1
          : this.randomOrder.length - 1;
        // 获取上一个 TrackId
        const prevTrackId = this.randomOrder[this.currentRandomIndex];
        // 找到该 TrackId 在 tracks 中的索引
        const prevIndex = this.tracks.findIndex(t => t.id === prevTrackId);
        return prevIndex >= 0 ? prevIndex : -1;

      case PlayMode.SINGLE:
        return this.currentIndex;

      default:
        return this.currentIndex > 0 ? this.currentIndex - 1 : length - 1;
    }
  }

  /**
   * 下一首
   */
  next() {
    const nextIndex = this.getNextIndex();
    if (nextIndex >= 0) {
      this.currentIndex = nextIndex;
      return this.getCurrentTrack();
    }
    return null;
  }

  /**
   * 上一首
   */
  previous() {
    const prevIndex = this.getPreviousIndex();
    if (prevIndex >= 0) {
      this.currentIndex = prevIndex;
      return this.getCurrentTrack();
    }
    return null;
  }

  /**
   * 跳转到指定索引
   */
  jump(index) {
    if (index >= 0 && index < this.tracks.length) {
      this.currentIndex = index;

      // 如果是随机模式，同步 currentRandomIndex
      if (this.mode === PlayMode.RANDOM && this.randomOrder.length > 0) {
        const trackId = this.tracks[index].id;
        const randomIndex = this.randomOrder.indexOf(trackId);
        if (randomIndex >= 0) {
          this.currentRandomIndex = randomIndex;
        }
      }

      return this.getCurrentTrack();
    }
    return null;
  }

  /**
   * 跳转到指定轨道ID
   */
  jumpToTrack(trackId) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    return this.jump(index);
  }

  /**
   * 添加轨道到队列
   */
  addTrack(track) {
    if (!this.tracks.some(t => t.id === track.id)) {
      this.tracks.push({
        ...track,
        id: track.id || generateId(),
      });

      // 如果存在随机播放顺序，在随机位置插入新 TrackId
      if (this.randomOrder.length > 0) {
        const newTrackId = track.id || this.tracks[this.tracks.length - 1].id;
        const randomPos = Math.floor(Math.random() * (this.randomOrder.length + 1));
        this.randomOrder.splice(randomPos, 0, newTrackId);
      }

      return true;
    }
    return false;
  }

  /**
   * 从队列移除轨道
   */
  removeTrack(trackId) {
    const index = this.tracks.findIndex(t => t.id === trackId);
    if (index > -1) {
      this.tracks.splice(index, 1);

      // 调整当前索引
      if (index < this.currentIndex) {
        // 删除的轨道在当前播放轨道之前，索引需要减1
        this.currentIndex--;
      } else if (index === this.currentIndex) {
        // 删除的是当前播放的轨道
        // 保持 currentIndex 不变，让它指向下一首（原来的下一首现在在当前位置）
        // 但需要检查边界
        if (this.currentIndex >= this.tracks.length) {
          this.currentIndex = Math.max(0, this.tracks.length - 1);
        }
      }
      // 如果 index > this.currentIndex，不需要调整

      // 如果存在随机播放顺序，直接移除该 TrackId
      if (this.randomOrder.length > 0) {
        this.randomOrder = this.randomOrder.filter(id => id !== trackId);
      }

      return true;
    }
    return false;
  }

  /**
   * 重新排序队列中的轨道
   */
  reorder(fromIndex, toIndex) {
    if (
      fromIndex < 0 || fromIndex >= this.tracks.length ||
      toIndex < 0 || toIndex >= this.tracks.length
    ) {
      return false;
    }

    const [track] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, track);

    // 调整当前索引
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }

    return true;
  }

  /**
   * 清空队列
   */
  clear() {
    this.tracks = [];
    this.currentIndex = 0;
    this.randomOrder = [];
    this.currentRandomIndex = 0;
  }


  /**
   * 获取队列中的轨道数
   */
  getTrackCount() {
    return this.tracks.length;
  }
}

/**
 * 生成唯一ID
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
