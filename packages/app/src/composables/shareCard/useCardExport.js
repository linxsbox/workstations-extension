/**
 * 卡片导出功能
 */
import { clipboard } from '@linxs/toolkit'

export function useCardExport() {
  /**
   * 复制卡片为图片
   * @param {string} selector - CSS 选择器
   * @returns {Promise<void>}
   */
  const copyCardAsImage = async (selector) => {
    try {
      // 动态导入 snapdom
      const { snapdom } = await import('@zumer/snapdom')

      // 查找目标元素
      const cardElement = document.querySelector(selector)
      if (!cardElement) {
        throw new Error(`未找到元素: ${selector}`)
      }

      // 使用 snapdom 生成 image/png
      const snapdomBlob = await snapdom.toBlob(cardElement, {
        embedFonts: false,
        backgroundColor: null, // 保持透明背景
        scale: 2,
        dpr: window.devicePixelRatio || 1,
        type: 'png'
      })

      // 使用 clipboard 工具复制图片
      await clipboard({
        type: 'blob',
        data: { 'image/png': snapdomBlob }
      })
    } catch (error) {
      console.error('复制图片失败:', error)
      throw error
    }
  }

  return {
    copyCardAsImage
  }
}
