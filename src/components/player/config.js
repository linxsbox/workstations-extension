import { eventListener, s2DHMS, PubSub } from "@linxs/toolkit";

// 格式化播放时间
export const formatPlayTime = (seconds = 0) => {
  if (!seconds) return "00:00:00";
  const { h, m, s } = s2DHMS(seconds);
  const formatNumber = (num) => num.toString().padStart(2, "0");

  return [formatNumber(h), formatNumber(m), formatNumber(Math.floor(s))].join(
    ":"
  );
};

export class PlayerProgressDnD extends PubSub {
  #isDnD = false;
  #mousemove = null;
  #mouseup = null;
  #mouseleave = null;
  /** 播放器元素 */
  #playerBoxEl = null;
  /** 播放器进度条元素 */
  #playerProgressBarEl = null;
  /** 进度条元素 */
  #progressBarEl = null;
  /** 是否禁用 - 外部更新 */
  #disabled = true;

  #currentWidth = 0;
  /** 记录当前点位 x - handleDnD 时赋值 */
  #currentPointX = 0;
  /** 最后记录宽度 */
  #lastWidth = 0;

  /**
   * @param {*} playerBoxEl 播放器元素
   * @param {*} playerProgressBarEl 播放器进度条元素
   * @param {*} progressBarEl 进度条元素
   */
  constructor(playerBoxEl, playerProgressBarEl, progressBarEl) {
    super();

    this.#isDnD = false;
    this.#mousemove = null;
    this.#mouseup = null;
    this.#mouseleave = null;
    this.#playerBoxEl = playerBoxEl;
    this.#playerProgressBarEl = playerProgressBarEl;
    this.#progressBarEl = progressBarEl;

    this.#disabled = true;

    this.#currentWidth = 0;
    this.#currentPointX = 0;
    this.#lastWidth = 0;
  }

  // 这里要使用箭头函数，保证 this 指向当前实例
  /** 拖动触发事件 - mousedown */
  handleDnD(event) {
    this.#isDnD = true;

    event.stopPropagation();
    if (this.#disabled) return;

    // 阻止选中
    document.onselectstart = () => false;

    // 记录当前点位 x
    this.#currentPointX = event.clientX;
    // 获取当前进度条宽度
    this.#currentWidth = this.#getCurrentProgressBarWidth();

    this.#initDnDEvents();
  }

  /** 拖动 */
  #moveDrag(event) {
    // 阻止选中
    event.preventDefault();
    // 拖动逻辑只改变进度条宽度，并更新最后记录位置
    const lastPosition = this.#compoutedMoveDistance(event);

    const width = this.#updateProgressWidth(lastPosition);
    this.#lastWidth = width;

    this.trigger("mousemove", { width });
  }
  /** 拖动结束 */
  #overDrag(event) {
    this.#cleanup(event);
    this.trigger("mouseup", { width: this.#lastWidth });
  }
  /** 拖动离开 */
  #leaveDrag(event) {
    this.#cleanup(event);
    this.trigger("mouseleave", { width: this.#lastWidth });
  }

  /** 更新进度条状态 */
  #updateProgressWidth(offsetWidth) {
    // 禁用时不更新
    if (this.#disabled) return;

    // 计算新的进度条宽度，无传入宽度时使用当前宽度
    const width = Number.isFinite(offsetWidth)
      ? offsetWidth
      : this.#getCurrentProgressBarWidth();

    return width;
  }

  /** 计算拖动距离 */
  #compoutedMoveDistance(event) {
    // 点击坐标 - 当前坐标 + 进度宽度
    const nextX = this.#currentWidth + (event.clientX - this.#currentPointX);

    // 边界处理
    if (nextX > this.#getPlayerProgressBarWidth()) return;
    if (nextX < 0) return;

    return nextX;
  }

  /** 获取播放器进度条总宽度 */
  #getPlayerProgressBarWidth() {
    return this.#playerProgressBarEl.offsetWidth;
  }

  /** 获取当前进度条宽度 */
  #getCurrentProgressBarWidth() {
    return this.#progressBarEl.offsetWidth;
  }

  /** 初始化拖动事件 */
  #initDnDEvents() {
    this.#mousemove = eventListener(
      this.#playerBoxEl,
      "mousemove",
      this.#moveDrag.bind(this)
    );
    this.#mouseup = eventListener(
      this.#playerBoxEl,
      "mouseup",
      this.#overDrag.bind(this)
    );
    this.#mouseleave = eventListener(
      this.#playerBoxEl,
      "mouseleave",
      this.#leaveDrag.bind(this)
    );
  }

  #cleanup = (event) => {
    event.stopPropagation();
    this.#mousemove();
    this.#mouseup();
    this.#mouseleave();

    this.#isDnD = false;

    const st = setTimeout(() => {
      // 恢复选中
      document.onselectstart = null;
      clearTimeout(st);
    }, 300);
  };

  get isDnD() {
    return this.#isDnD;
  }

  get disabled() {
    return this.#disabled;
  }

  set disabled(value) {
    this.#disabled = value;
  }
}

// 更新媒体封面
export const updateMediaCover = (album = {}, title) => {
  if ("mediaSession" in navigator) {
    if (!album || !album.image) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: album.author,
      album: album.albumTitle,
      artwork: [{ src: album.image, sizes: "300x300", type: "image/jpeg" }],
    });
  }
};
