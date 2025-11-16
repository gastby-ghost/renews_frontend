/**
 * OpenAPI集成验证脚本
 * 用于验证core_openapi.json集成是否正确
 */

import { API_MODULES } from './modules/core'

console.log('🚀 开始验证OpenAPI集成...')

// 1. 验证模块数量
const moduleNames = Object.keys(API_MODULES)
console.log(`📊 发现 ${moduleNames.length} 个OpenAPI模块:`, moduleNames)

// 2. 验证每个模块
let totalEndpoints = 0
moduleNames.forEach((moduleName) => {
  const service = API_MODULES[moduleName as keyof typeof API_MODULES]
  const endpointCount = Object.keys(service.paths).length
  totalEndpoints += endpointCount

  console.log(`\n📋 ${service.name}:`)
  console.log(`   基础路径: ${service.baseUrl}`)
  console.log(`   支持方法: ${service.methods.join(', ')}`)
  console.log(`   API端点: ${endpointCount} 个`)
  console.log(`   Mock支持: ${service.enableMock ? '✅' : '❌'}`)
})

console.log(`\n🎯 总计: ${totalEndpoints} 个API端点`)

// 3. 验证模块配置
console.log('\n🔧 模块配置验证:')
let hasErrors = false

Object.entries(API_MODULES).forEach(([moduleName, service]) => {
  console.log(`   📋 ${service.name}:`)

  if (!service.name) {
    console.error(`   ❌ ${moduleName}: 缺少服务名称`)
    hasErrors = true
  }

  if (!service.baseUrl) {
    console.error(`   ❌ ${moduleName}: 缺少基础URL`)
    hasErrors = true
  }

  if (!service.methods || service.methods.length === 0) {
    console.error(`   ❌ ${moduleName}: 缺少HTTP方法`)
    hasErrors = true
  }

  if (!service.paths || Object.keys(service.paths).length === 0) {
    console.error(`   ❌ ${moduleName}: 缺少路径配置`)
    hasErrors = true
  }

  // 验证每个路径
  Object.entries(service.paths).forEach(([path, pathConfig]) => {
    if (!pathConfig.description) {
      console.error(`   ❌ ${moduleName} ${path}: 缺少路径描述`)
      hasErrors = true
    }

    if (!pathConfig.methods || pathConfig.methods.length === 0) {
      console.error(`   ❌ ${moduleName} ${path}: 缺少HTTP方法配置`)
      hasErrors = true
    }
  })

  if (!hasErrors) {
    console.log(`   ✅ ${service.name}: 配置结构正确`)
  }
})

console.log(`\n✅ 模块配置验证: ${hasErrors ? '失败' : '通过'}`)

// 4. 验证路径唯一性
console.log('\n🔑 路径唯一性验证:')
const allPaths = new Map<string, string[]>()

Object.entries(API_MODULES).forEach(([moduleName, service]) => {
  Object.keys(service.paths).forEach((path) => {
    if (!allPaths.has(path)) {
      allPaths.set(path, [])
    }
    allPaths.get(path)!.push(moduleName)
  })
})

let duplicatePaths = 0
allPaths.forEach((modules, path) => {
  if (modules.length > 1) {
    console.log(`   ⚠️  重复路径 ${path}: ${modules.join(', ')}`)
    duplicatePaths++
  }
})

if (duplicatePaths === 0) {
  console.log('   ✅ 所有路径唯一')
}

console.log('\n🎉 OpenAPI集成验证完成！')
