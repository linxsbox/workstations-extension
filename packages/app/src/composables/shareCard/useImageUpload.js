/**
 * 图片上传功能
 */
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

/**
 * 图片上传配置选项
 * @typedef {Object} UploadOptions
 * @property {number} maxSize - 最大文件大小（字节），默认 5MB
 * @property {string[]} acceptTypes - 允许的图片类型，默认 ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
 * @property {boolean} showMessage - 是否显示提示消息，默认 true
 */

export function useImageUpload(options = {}) {
  const message = useMessage()

  // 默认配置
  const defaultOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    showMessage: true
  }

  const config = { ...defaultOptions, ...options }

  // 响应式状态
  const imageUrl = ref('')
  const isUploading = ref(false)
  const uploadError = ref(null)
  const fileList = ref([])

  /**
   * 验证文件
   * @param {File} file - 文件对象
   * @returns {Object} { valid: boolean, error: string }
   */
  const validateFile = (file) => {
    if (!file) {
      return { valid: false, error: '未选择文件' }
    }

    // 验证文件类型
    if (!config.acceptTypes.includes(file.type)) {
      return {
        valid: false,
        error: `只支持 ${config.acceptTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} 格式的图片`
      }
    }

    // 验证文件大小
    if (file.size > config.maxSize) {
      const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1)
      return {
        valid: false,
        error: `图片大小不能超过 ${maxSizeMB}MB`
      }
    }

    return { valid: true, error: null }
  }

  /**
   * 读取文件为 Data URL
   * @param {File} file - 文件对象
   * @returns {Promise<string>} Data URL
   */
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        resolve(e.target.result)
      }

      reader.onerror = (error) => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsDataURL(file)
    })
  }

  /**
   * 处理文件上传
   * @param {File} file - 文件对象
   * @returns {Promise<string|null>} 返回图片 Data URL，失败返回 null
   */
  const handleUpload = async (file) => {
    if (!file) {
      uploadError.value = '未选择文件'
      return null
    }

    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      uploadError.value = validation.error
      if (config.showMessage) {
        message.error(validation.error)
      }
      return null
    }

    isUploading.value = true
    uploadError.value = null

    try {
      // 读取文件
      const dataUrl = await readFileAsDataURL(file)

      // 更新状态
      imageUrl.value = dataUrl

      if (config.showMessage) {
        message.success('图片上传成功')
      }

      return dataUrl
    } catch (error) {
      uploadError.value = error.message || '图片上传失败'
      if (config.showMessage) {
        message.error(uploadError.value)
      }
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 处理 NUpload 组件的 change 事件
   * @param {Object} param0 - NUpload 的 change 事件参数
   * @param {Object} param0.file - 文件对象
   * @returns {Promise<string|null>}
   */
  const handleNaiveUploadChange = async ({ file }) => {
    if (file.file) {
      const result = await handleUpload(file.file)
      // 注意：不清空 fileList，保留上传状态
      return result
    }
    return null
  }

  /**
   * 处理原生 input[type="file"] 的 change 事件
   * @param {Event} event - change 事件
   * @returns {Promise<string|null>}
   */
  const handleInputChange = async (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const result = await handleUpload(file)
      // 可选：清空 input，允许重复上传同一文件
      // event.target.value = ''
      return result
    }
    return null
  }

  /**
   * 触发文件选择（用于原生 input）
   * @param {HTMLInputElement} inputRef - input 元素引用
   */
  const triggerFileSelect = (inputRef) => {
    if (!inputRef) {
      console.warn('未提供 input 元素引用')
      return
    }

    // 清空之前的文件，允许重复上传
    if (inputRef.value) {
      inputRef.value = ''
    }

    inputRef.click()
  }

  /**
   * 触发 NUpload 文件选择
   * @param {Object} uploadRef - NUpload 组件引用
   */
  const triggerNaiveUpload = (uploadRef) => {
    if (!uploadRef?.value?.$el) {
      console.warn('未提供 NUpload 组件引用')
      return
    }

    // 清空文件列表，确保可以重复上传
    fileList.value = []

    // 触发隐藏的上传组件
    const input = uploadRef.value.$el.querySelector('input[type="file"]')
    if (input) {
      input.click()
    }
  }

  /**
   * 清空上传状态
   */
  const clearUpload = () => {
    imageUrl.value = ''
    uploadError.value = null
    fileList.value = []
  }

  /**
   * 设置图片 URL（用于初始化或外部设置）
   * @param {string} url - 图片 URL
   */
  const setImageUrl = (url) => {
    imageUrl.value = url
  }

  return {
    // 状态
    imageUrl,
    isUploading,
    uploadError,
    fileList,

    // 方法
    handleUpload,
    handleNaiveUploadChange,
    handleInputChange,
    triggerFileSelect,
    triggerNaiveUpload,
    validateFile,
    clearUpload,
    setImageUrl
  }
}
