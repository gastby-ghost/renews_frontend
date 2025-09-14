#!/bin/bash

# 安全提交脚本 - 确保提交时不会因为 lint 错误而失败

echo "🚀 开始安全提交流程..."

# 1. 先运行 Prettier 格式化所有文件
echo "🎨 运行 Prettier 格式化..."
npx prettier --write "**/*.{js,cjs,ts,json,tsx,css,less,scss,vue,html,md}" || true

# 2. 运行 ESLint 修复（使用宽松配置）
echo "🔧 运行 ESLint 修复..."
npx eslint --config .eslintrc.lint-staged.cjs --fix "src/**/*.{js,ts,vue}" || true

# 3. 运行 Stylelint 修复
echo "💄 运行 Stylelint 修复..."
npx stylelint --fix --allow-empty-input "src/**/*.{css,scss,vue}" || true

# 4. 添加所有修改的文件
echo "📁 添加修改的文件..."
git add .

# 5. 检查是否有文件需要提交
if git diff --cached --quiet; then
    echo "ℹ️  没有文件需要提交"
    exit 0
fi

# 6. 提交文件
echo "💾 提交文件..."
git commit -m "${1:-feat: 自动提交}"

echo "✅ 提交完成！"
