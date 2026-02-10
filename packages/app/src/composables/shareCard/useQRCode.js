/**
 * 二维码生成功能
 */
import { ref } from 'vue'
import { clipboard } from '@linxs/toolkit'

export function useQRCode() {
  const qrCodeUrl = ref('')
  const isGenerating = ref(false)
  const error = ref(null)

  /**
   * 生成二维码
   * @param {string} text - 要编码的文本内容
   * @param {Object} options - 二维码配置选项
   * @param {number} options.width - 二维码宽度（默认 200）
   * @param {number} options.height - 二维码高度（默认 200）
   * @param {string} options.colorDark - 前景色（默认 #000000）
   * @param {string} options.colorLight - 背景色（默认 #ffffff）
   * @param {string} options.correctLevel - 纠错级别 L/M/Q/H（默认 M）
   * @returns {Promise<string>} 返回二维码的 Data URL
   */
  const generateQRCode = async (text, options = {}) => {
    if (!text) {
      error.value = '文本内容不能为空'
      return null
    }

    isGenerating.value = true
    error.value = null

    try {
      // 动态导入 qrcode 库
      const QRCode = await import('qrcode')

      // 默认配置
      const defaultOptions = {
        width: 200,
        height: 200,
        margin: 1,
        color: {
          dark: options.colorDark || '#000000',
          light: options.colorLight || '#ffffff'
        },
        errorCorrectionLevel: options.correctLevel || 'M'
      }

      // 合并配置
      const finalOptions = { ...defaultOptions, ...options }

      // 生成二维码 Data URL
      const dataUrl = await QRCode.default.toDataURL(text, finalOptions)

      qrCodeUrl.value = dataUrl
      return dataUrl
    } catch (err) {
      console.error('生成二维码失败:', err)
      error.value = err.message || '生成二维码失败'
      return null
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * 生成二维码并下载
   * @param {string} text - 要编码的文本内容
   * @param {string} filename - 下载的文件名（默认 qrcode.png）
   * @param {Object} options - 二维码配置选项
   * @returns {Promise<void>}
   */
  const downloadQRCode = async (text, filename = 'qrcode.png', options = {}) => {
    const dataUrl = await generateQRCode(text, options)

    if (!dataUrl) {
      throw new Error('生成二维码失败')
    }

    // 创建下载链接
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * 生成二维码并复制到剪贴板
   * @param {string} text - 要编码的文本内容
   * @param {Object} options - 二维码配置选项
   * @returns {Promise<void>}
   */
  const copyQRCodeToClipboard = async (text, options = {}) => {
    const dataUrl = await generateQRCode(text, options)

    if (!dataUrl) {
      throw new Error('生成二维码失败')
    }

    try {
      // 将 Data URL 转换为 Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // 使用 @linxs/toolkit 的 clipboard 工具复制
      await clipboard({
        type: 'blob',
        data: { 'image/png': blob }
      })
    } catch (err) {
      console.error('复制二维码失败:', err)
      throw new Error('复制二维码失败')
    }
  }

  /**
   * 清空二维码
   */
  const clearQRCode = () => {
    qrCodeUrl.value = ''
    error.value = null
  }

  return {
    qrCodeUrl,
    isGenerating,
    error,
    generateQRCode,
    downloadQRCode,
    copyQRCodeToClipboard,
    clearQRCode
  }
}
