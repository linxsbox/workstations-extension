/**
 * 创建消息构建器
 * @param {string} moduleName - 当前模块名称
 * @returns {Object} 消息构建器
 */
export const createMessageBuilder = (moduleName) => {
  if (!moduleName) {
    throw new Error('模块名称 (moduleName) 不能为空');
  }

  return {
    /**
     * 构建消息
     * @param {Object} params - 消息参数
     * @param {string} params.to - 消息目标模块
     * @param {string} params.action - 动作类型
     * @param {*} params.data - 数据内容
     * @param {string} params.service - 服务名
     * @returns {Object} 标准消息格式
     */
    send: ({ to, action, data, service }) => {
      if (!to) {
        throw new Error('消息目标 (to) 不能为空');
      }
      if (!action) {
        throw new Error('动作 (action) 不能为空');
      }

      return {
        from: moduleName,
        timestamp: Date.now(),
        to,
        action,
        data,
        service,
      };
    },
  };
};
