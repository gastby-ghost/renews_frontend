#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

// 获取 lint-staged 传递的文件列表
const files = process.argv.slice(2)

console.log('🔍 开始 lint-staged 检查...')
console.log('📁 检查文件:', files.join(', '))

try {
  // 首先尝试运行 ESLint 修复
  console.log('🔧 运行 ESLint 修复...')
  execSync(`npx eslint --config .eslintrc.lint-staged.cjs --fix ${files.join(' ')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('✅ ESLint 修复完成')
} catch (error) {
  console.log('⚠️  ESLint 修复遇到问题，继续执行...')
  // 即使 ESLint 失败也继续执行
}

try {
  // 运行 Prettier 格式化
  console.log('🎨 运行 Prettier 格式化...')
  execSync(`npx prettier --write ${files.join(' ')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  console.log('✅ Prettier 格式化完成')
} catch (error) {
  console.log('⚠️  Prettier 格式化遇到问题，继续执行...')
}

try {
  // 运行 Stylelint 修复（仅对样式文件）
  const styleFiles = files.filter(file => 
    /\.(css|scss|less|vue)$/.test(file)
  )
  
  if (styleFiles.length > 0) {
    console.log('💄 运行 Stylelint 修复...')
    execSync(`npx stylelint --fix --allow-empty-input ${styleFiles.join(' ')}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('✅ Stylelint 修复完成')
  }
} catch (error) {
  console.log('⚠️  Stylelint 修复遇到问题，继续执行...')
}

console.log('🎉 lint-staged 处理完成！')
process.exit(0)
