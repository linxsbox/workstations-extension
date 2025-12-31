/**
 * 播放器相关的类型和枚举定义
 */

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
    this.isShuffled = data.isShuffled || false;
    this.originalOrder = null; // 用于保存原始顺序（随机模式时）
  }

  /**
   * 从播放列表初始化队列
   */
  static fromPlaylist(playlist, mode = PlayMode.LOOP) {
    const queue = new PlayQueue({
      tracks: [...playlist.tracks],
      mode,
    });

    if (mode === PlayMode.RANDOM) {
      queue.shuffle();
    }

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
        return (this.currentIndex + 1) % length;

      case PlayMode.SINGLE:
        return this.currentIndex;

      default:
        return (this.currentIndex + 1) % length;
    }
  }

  /**
   * 获取上一首轨道索引
   */
  getPreviousIndex() {
    const length = this.tracks.length;
    if (length === 0) return -1;

    const newIndex = this.currentIndex - 1;

    switch (this.mode) {
      case PlayMode.SEQUENTIAL:
        return newIndex >= 0 ? newIndex : -1;

      case PlayMode.LOOP:
        return newIndex >= 0 ? newIndex : length - 1;

      case PlayMode.RANDOM:
        return newIndex >= 0 ? newIndex : length - 1;

      case PlayMode.SINGLE:
        return this.currentIndex;

      default:
        return newIndex >= 0 ? newIndex : length - 1;
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
      if (this.currentIndex >= this.tracks.length) {
        this.currentIndex = Math.max(0, this.tracks.length - 1);
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
    this.originalOrder = null;
  }

  /**
   * 随机打乱队列（用于随机模式）
   */
  shuffle() {
    if (this.isShuffled) return;

    // 保存原始顺序
    this.originalOrder = [...this.tracks];

    // Fisher-Yates 洗牌算法
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }

    this.currentIndex = 0;
    this.isShuffled = true;
  }

  /**
   * 恢复原始顺序（退出随机模式）
   */
  unshuffle() {
    if (!this.isShuffled || !this.originalOrder) return;

    const currentTrack = this.getCurrentTrack();
    this.tracks = this.originalOrder;
    this.originalOrder = null;

    // 找到当前轨道在原始顺序中的位置
    if (currentTrack) {
      this.currentIndex = this.tracks.findIndex(t => t.id === currentTrack.id);
    }

    this.isShuffled = false;
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
