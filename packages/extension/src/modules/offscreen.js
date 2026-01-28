/**
 * 创建 Offscreen Document
 * @returns {Promise<boolean>}
 */
export const createOffscreenDocument = async () => {
  try {
    // 检查是否已存在 offscreen document
    const existingContexts = await checkOffscreenExists();

    if (existingContexts) {
      console.log("[Offscreen] 检查状态：", existingContexts);
      return existingContexts;
    }

    // 创建 Document
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL("background/offscreen/service_offscreen.html"),
      reasons: ["WORKERS"],
      justification:
        "Maintain WebRTC connections to support audio processing, ONNX model inference, and peer communication services",
    });

    console.log("[Offscreen] 创建 Document 完成");
    return true;
  } catch (error) {
    console.error("[Offscreen] 创建 Document 失败:", error);
    return false;
  }
};

/**
 * 检查 Offscreen Document 是否存在
 * @returns {Promise<boolean>}
 */
export const checkOffscreenExists = async () => {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });
    return existingContexts.length > 0;
  } catch (error) {
    return false;
  }
};
