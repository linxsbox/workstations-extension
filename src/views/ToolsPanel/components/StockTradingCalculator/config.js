export const tradeTypeEnum = {
  BUY: "BUY",
  SELL: "SELL",
};

// 交易类型转换所需值显示
export const tradeTypeToValue = (type, isClass = false) => {
  const tmp = {
    BUY: !isClass ? "买" : "text-[var(--trade-type-buy-color)]",
    SELL: !isClass ? "卖" : "text-[var(--trade-type-sell-color)]",
  };
  return tmp[type] || "???";
};
