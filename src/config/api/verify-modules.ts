/**
 * OpenAPI模块验证脚本
 * 用于验证模块配置是否正确
 */

import { API_MODULES } from './modules/core'

console.log('🚀 开始验证OpenAPI模块...')

// 1. 验证模块数量
const moduleNames = Object.keys(API_MODULES)
console.log(`📊 发现 ${moduleNames.length} 个OpenAPI模块:`, moduleNames)

// 2. 验证每个模块
let totalEndpoints = 0
const moduleStats: Array<{ name: string; endpoints: number; methods: string[] }> = []

moduleNames.forEach((moduleName) => {
  const service = API_MODULES[moduleName as keyof typeof API_MODULES]
  const endpointCount = Object.keys(service.paths).length
  totalEndpoints += endpointCount

  // 统计所有使用的方法
  const allMethods = new Set<string>()
  Object.values(service.paths).forEach((pathConfig) => {
    pathConfig.methods.forEach((method) => allMethods.add(method))
  })

  moduleStats.push({
    name: service.name,
    endpoints: endpointCount,
    methods: Array.from(allMethods).sort()
  })

  console.log(`\n📋 ${service.name}:`)
  console.log(`   基础路径: ${service.baseUrl}`)
  console.log(`   支持方法: ${Array.from(allMethods).sort().join(', ')}`)
  console.log(`   API端点: ${endpointCount} 个`)
  console.log(`   Mock支持: ${service.enableMock ? '✅' : '❌'}`)
})

console.log(`\n🎯 总计: ${totalEndpoints} 个API端点`)

// 3. 生成统计摘要
console.log('\n📈 模块统计摘要:')
moduleStats.forEach((stat) => {
  console.log(`   ${stat.name}: ${stat.endpoints} 端点 (${stat.methods.join(', ')})`)
})

// 4. 验证配置结构
console.log('\n🔍 配置结构验证:')
let hasErrors = false

moduleNames.forEach((moduleName) => {
  const service = API_MODULES[moduleName as keyof typeof API_MODULES]

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

// 5. 验证路径唯一性
console.log('\n🔑 路径唯一性验证:')
const allPaths = new Map<string, string[]>()

moduleNames.forEach((moduleName) => {
  const service = API_MODULES[moduleName as keyof typeof API_MODULES]
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

// 6. 生成集成报告
console.log('\n📋 OpenAPI集成报告:')
console.log(`   ✅ 模块数量: ${moduleNames.length}`)
console.log(`   ✅ API端点: ${totalEndpoints}`)
console.log(`   ✅ 配置验证: ${hasErrors ? '❌ 有错误' : '✅ 通过'}`)
console.log(`   ✅ 路径唯一性: ${duplicatePaths === 0 ? '通过' : `${duplicatePaths} 个重复`}`)

if (!hasErrors) {
  console.log('\n🎉 OpenAPI模块验证完成！所有配置正确。')
} else {
  console.log('\n⚠️  发现配置错误，请检查上述输出。')
  process.exit(1)
}
