/**
 * 时间处理工具函数
 */

/**
 * 移除时间字符串中的秒和时区信息
 * @param {string} dateStr - 时间字符串，如 "2024-12-31T10:30:45+08:00"
 * @returns {string} 移除秒和时区后的时间字符串，如 "2024-12-31T10:30"
 */
export function rmSecAndZone(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return ''

  try {
    // 移除秒、毫秒和时区信息
    return dateStr.replace(/:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/, '')
  } catch (error) {
    console.error('rmSecAndZone error:', error)
    return dateStr
  }
}

/**
 * 计算时间差并返回友好的"多久之前"文本
 * @param {Date|number|string} currentTime - 当前时间
 * @param {Date|number|string} targetTime - 目标时间
 * @returns {string} 如 "1小时前"、"3天前"、"刚刚"
 */
export function timeBefore(currentTime, targetTime) {
  try {
    const current = new Date(currentTime).getTime()
    const target = new Date(targetTime).getTime()

    if (isNaN(current) || isNaN(target)) {
      return ''
    }

    const diff = current - target // 时间差（毫秒）

    if (diff < 0) {
      return '未来'
    }

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years > 0) {
      return `${years}年前`
    } else if (months > 0) {
      return `${months}个月前`
    } else if (days > 0) {
      return `${days}天前`
    } else if (hours > 0) {
      return `${hours}小时前`
    } else if (minutes > 0) {
      return `${minutes}分钟前`
    } else if (seconds > 30) {
      return `${seconds}秒前`
    } else {
      return '刚刚'
    }
  } catch (error) {
    console.error('timeBefore error:', error)
    return ''
  }
}

/**
 * 将秒转换为分钟（格式化为 mm:ss）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串，如 "03:45"
 */
export function sec2min(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00'
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
