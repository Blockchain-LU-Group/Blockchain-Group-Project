#!/bin/bash

echo "Starting frontend..."
cd "$(dirname "$0")/frontend"

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动开发服务器
echo "🌟 启动开发服务器..."
echo "📍 访问地址: http://localhost:3002"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""


PORT=3002 npm run dev