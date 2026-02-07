#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 验证 AI 模块转换结果
 */

const fs = require('fs')
const path = require('path')

// 获取当前文件所在目录
const __dirname = path.dirname(process.cwd())

const aiModulesDir = path.join(__dirname, '../src/config/api/modules/ai')

console.log('🔍 验证 AI 模块转换结果...\n')

// 检查文件是否存在
if (!fs.existsSync(aiModulesDir)) {
  console.error('❌ AI 模块目录不存在')
  process.exit(1)
}

// 读取所有生成的文件
const files = fs.readdirSync(aiModulesDir).filter((file) => file.endsWith('.ts'))
const indexFile = path.join(aiModulesDir, 'index.ts')

console.log(`📁 找到 ${files.length} 个 TypeScript 文件:`)
files.forEach((file) => console.log(`   - ${file}`))

// 检查索引文件
if (!fs.existsSync(indexFile)) {
  console.error('\n❌ 索引文件 index.ts 不存在')
  process.exit(1)
}

console.log('\n✅ 索引文件存在')

// 读取并验证索引文件内容
const indexContent = fs.readFileSync(indexFile, 'utf8')

// 检查导出的服务
const servicePattern = /export const (\w+Service):/g
const services = []
let match

while ((match = servicePattern.exec(indexContent)) !== null) {
  services.push(match[1])
}

console.log(`\n📊 导出的服务数量: ${services.length}`)
services.forEach((service) => console.log(`   - ${service}`))

// 检查 AI_API_MODULES 导出
if (indexContent.includes('export const AI_API_MODULES')) {
  console.log('\n✅ AI_API_MODULES 导出正确')
} else {
  console.log('\n❌ AI_API_MODULES 导出缺失')
}

// 验证每个文件的基本结构
console.log('\n🔧 验证文件结构...')
files.forEach((file) => {
  const filePath = path.join(aiModulesDir, file)
  const content = fs.readFileSync(filePath, 'utf8')

  const hasApiEndpointConfig = content.includes('ApiEndpointConfig')
  const hasExport = content.includes('export const')
  const hasName = content.includes('name:')

  if (hasApiEndpointConfig && hasExport && hasName) {
    console.log(`   ✅ ${file} 结构正确`)
  } else {
    console.log(`   ❌ ${file} 结构有问题`)
    console.log(`      - ApiEndpointConfig: ${hasApiEndpointConfig}`)
    console.log(`      - export const: ${hasExport}`)
    console.log(`      - name: ${hasName}`)
  }
})

// 统计API端点数量
console.log('\n📈 统计API端点...')
let totalEndpoints = 0

files.forEach((file) => {
  if (file === 'index.ts') return

  const filePath = path.join(aiModulesDir, file)
  const content = fs.readFileSync(filePath, 'utf8')

  const pathMatches = content.match(/'\/[^']+'/g)
  const endpointCount = pathMatches ? pathMatches.length : 0
  totalEndpoints += endpointCount

  console.log(`   - ${file}: ${endpointCount} 个端点`)
})

console.log(`\n🎯 总计: ${totalEndpoints} 个API端点`)

// 验证完成
console.log('\n🎉 AI 模块转换验证完成！')
console.log(`📂 目录: ${aiModulesDir}`)
console.log(`📄 文件: ${files.length} 个`)
console.log(`🔗 端点: ${totalEndpoints} 个`)
