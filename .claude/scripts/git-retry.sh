#!/bin/bash

# Git 命令重试脚本
# 用法: ./git-retry.sh <git 命令和参数>
# 例如:
#   ./git-retry.sh push origin main
#   ./git-retry.sh pull origin main
#   ./git-retry.sh fetch --all
#   ./git-retry.sh push -u origin fix/player-drag-standard-mode

# 配置
MAX_RETRIES=10
RETRY_INTERVAL=20

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取所有传入的参数
GIT_COMMAND="$@"

# 检查是否提供了参数
if [ -z "$GIT_COMMAND" ]; then
  echo -e "${RED}错误: 请提供 git 命令${NC}"
  echo -e "用法: $0 <git 命令和参数>"
  echo -e "例如: $0 push origin main"
  echo -e "     $0 pull origin main"
  echo -e "     $0 fetch --all"
  exit 1
fi

# 静默执行，只在需要时输出

# 重试逻辑
attempt=1

while [ $attempt -le $MAX_RETRIES ]; do
  # 只在重试时显示提示
  if [ $attempt -gt 1 ]; then
    echo -e "${YELLOW}[重试 $attempt/$MAX_RETRIES]${NC}"
  fi

  # 执行 git 命令
  git $GIT_COMMAND

  # 检查退出状态
  if [ $? -eq 0 ]; then
    exit 0
  else
    if [ $attempt -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}等待 ${RETRY_INTERVAL}s 后重试...${NC}"
      sleep $RETRY_INTERVAL
    else
      echo -e "${RED}已达到最大重试次数 (${MAX_RETRIES})${NC}"
      exit 1
    fi
  fi

  ((attempt++))
done
