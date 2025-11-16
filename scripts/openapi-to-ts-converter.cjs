#!/usr/bin/env node

/**
 * OpenAPI 3.1.0 到 TypeScript API 配置转换器
 * 将 core_openapi 中的 JSON 文件转换为 src/config/api/modules/ 中的 TypeScript 文件
 */

const fs = require('fs')
const path = require('path')

// 配置
const config = {
  inputDir: path.join(__dirname, '../core_openapi'),
  outputDir: path.join(__dirname, '../src/config/api/modules'),
  templateDir: path.join(__dirname, '../src/config/api')
}

/**
 * 提取 OpenAPI 路径信息并转换为 API 配置格式
 */
function extractPathInfo(openapiSpec, fileName) {
  const paths = openapiSpec.paths || {}
  const result = {}

  Object.entries(paths).forEach(([pathKey, pathValue]) => {
    // 路径键格式如 "POST/api/v1/core/materials/batch"
    const [method, ...pathParts] = pathKey.split('/')
    const cleanPath = '/' + pathParts.join('/')

    // 获取方法配置
    const methodConfig = pathValue[method.toLowerCase()]
    if (!methodConfig) return

    // 构建路径配置
    result[cleanPath] = {
      description:
        methodConfig.summary || methodConfig.description || `${method.toUpperCase()} ${cleanPath}`,
      methods: [method.toUpperCase()],
      request: {
        bodyType: 'json',
        requireAuth: hasAuthRequirement(methodConfig.security),
        params: extractParams(methodConfig)
      },
      response: {
        dataType: extractResponseType(methodConfig.responses),
        statusCode: 200
      }
    }

    // 合并相同路径的不同方法
    if (result[cleanPath]) {
      const existingEntry = Object.entries(result).find(([key]) => key === cleanPath)
      if (existingEntry && existingEntry[1].methods[0] !== method.toUpperCase()) {
        existingEntry[1].methods.push(method.toUpperCase())
        existingEntry[1].methods.sort()
      }
    }
  })

  return result
}

/**
 * 检查是否需要认证
 */
function hasAuthRequirement(security) {
  if (!security || !Array.isArray(security)) return false
  return security.some((sec) => sec.HTTPBearer || sec.BearerAuth || sec.ApiKeyAuth)
}

/**
 * 提取参数信息
 */
function extractParams(methodConfig) {
  const params = {}

  // 提取请求体参数
  if (methodConfig.requestBody && methodConfig.requestBody.content) {
    const content = methodConfig.requestBody.content['application/json']
    if (content && content.schema && content.schema.$ref) {
      const schemaName = content.schema.$ref.split('/').pop()
      params.body = `schema: ${schemaName} - 请求体数据结构`
    }
  }

  // 提取查询参数
  if (methodConfig.parameters) {
    methodConfig.parameters.forEach((param) => {
      if (param.in === 'query' || param.in === 'path') {
        const type = param.schema?.type || 'unknown'
        const required = param.required ? '必需' : '可选'
        params[param.name] = `${type} - ${param.description || param.name} (${required})`
      }
    })
  }

  return params
}

/**
 * 提取响应类型
 */
function extractResponseType(responses) {
  const successResponse = responses['200'] || responses['201']
  if (!successResponse || !successResponse.content) return 'unknown'

  const content = successResponse.content['application/json']
  if (content && content.schema && content.schema.$ref) {
    return content.schema.$ref.split('/').pop()
  }

  return 'Response'
}

/**
 * 生成 TypeScript 文件内容
 */
function generateTypeScriptContent(fileName, openapiSpec, pathInfo) {
  const serviceName = getServiceName(fileName)
  const baseUrl = extractBaseUrl(openapiSpec)

  return `/**
 * ${serviceName}模块API配置
 * 基于 ${fileName}.json OpenAPI 3.1.0 规范
 */

import type { ApiEndpointConfig } from '../types'

export const ${getServiceKey(fileName)}: ApiEndpointConfig = {
  name: '${serviceName}',
  baseUrl: '${baseUrl}',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  enableMock: true,
  mockPath: '/mock/data/${fileName}',
  defaults: {
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer {token}'
    },
    retryCount: 2,
    enableCache: true
  },
  paths: ${formatPaths(pathInfo)}
}
`
}

/**
 * 格式化路径配置
 */
function formatPaths(pathInfo) {
  const entries = Object.entries(pathInfo)
  if (entries.length === 0) return '{}'

  const formatted = entries
    .map(([path, config]) => {
      const configStr = JSON.stringify(config, null, 6)
        .replace(/"([^"]+)":/g, '$1:') // 转换属性名为无引号格式
        .replace(/"/g, "'") // 转换为单引号

      return `    // ${config.description}\n    '${path}': ${configStr}`
    })
    .join(',\n\n')

  return `{\n${formatted}\n  }`
}

/**
 * 从文件名获取服务名称
 */
function getServiceName(fileName) {
  const nameMap = {
    auth: '用户认证服务',
    material: '素材管理服务',
    project: '项目管理服务',
    outlines: '大纲管理服务',
    'outline-sections': '大纲章节服务',
    titles: '标题生成服务',
    research_briefs: '研究简报服务',
    requirements: '需求管理服务',
    bodies: '内容管理服务',
    'material-relations': '素材关联服务'
  }
  return nameMap[fileName] || `${fileName}服务`
}

/**
 * 从文件名获取服务键名
 */
function getServiceKey(fileName) {
  const keyMap = {
    auth: 'authService',
    material: 'materialService',
    project: 'projectService',
    outlines: 'outlineService',
    'outline-sections': 'outlineSectionService',
    titles: 'titleService',
    research_briefs: 'researchBriefService',
    requirements: 'requirementService',
    bodies: 'bodyService',
    'material-relations': 'materialRelationService'
  }
  return keyMap[fileName] || `${fileName}Service`
}

/**
 * 提取基础URL
 */
function extractBaseUrl(openapiSpec) {
  const servers = openapiSpec.servers
  if (servers && servers.length > 0) {
    return new URL(servers[0].url).pathname
  }

  // 从路径中推断基础URL
  const paths = Object.keys(openapiSpec.paths || {})
  if (paths.length > 0) {
    const firstPath = paths[0]
    const match = firstPath.match(/(POST|GET|PUT|DELETE)(\/api\/[^\/]+)/)
    if (match) {
      return match[2]
    }
  }

  return '/api/v1/core'
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始转换 OpenAPI 规范到 TypeScript 配置...\n')

  // 确保输出目录存在
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true })
  }

  // 读取所有 OpenAPI 文件
  const files = fs
    .readdirSync(config.inputDir)
    .filter((file) => file.endsWith('.json'))
    .filter((file) => !file.includes('ai')) // 排除 AI 服务，已经存在

  console.log(`📁 找到 ${files.length} 个 OpenAPI 文件:`)
  files.forEach((file) => console.log(`   - ${file}`))
  console.log('')

  // 转换每个文件
  const results = []
  files.forEach((file) => {
    try {
      const filePath = path.join(config.inputDir, file)
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const openapiSpec = JSON.parse(fileContent)

      const fileName = path.basename(file, '.json')
      const pathInfo = extractPathInfo(openapiSpec, fileName)
      const tsContent = generateTypeScriptContent(fileName, openapiSpec, pathInfo)

      const outputPath = path.join(config.outputDir, `${fileName}.ts`)
      fs.writeFileSync(outputPath, tsContent)

      results.push({ file: fileName, success: true, paths: Object.keys(pathInfo).length })
      console.log(`✅ ${file} → ${fileName}.ts (${Object.keys(pathInfo).length} 个API端点)`)
    } catch (error) {
      console.error(`❌ ${file} 转换失败:`, error.message)
      results.push({ file: path.basename(file, '.json'), success: false, error: error.message })
    }
  })

  // 输出总结
  console.log('\n📊 转换总结:')
  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)
  const totalPaths = successful.reduce((sum, r) => sum + r.paths, 0)

  console.log(`   ✅ 成功: ${successful.length} 个文件`)
  console.log(`   ❌ 失败: ${failed.length} 个文件`)
  console.log(`   🔗 总计: ${totalPaths} 个API端点`)

  if (failed.length > 0) {
    console.log('\n❌ 失败详情:')
    failed.forEach((r) => console.log(`   - ${r.file}: ${r.error}`))
  }

  console.log('\n🎉 转换完成！')
  console.log(`📂 输出目录: ${config.outputDir}`)

  // 提示更新 index.ts
  console.log('\n💡 提示: 请手动更新 src/config/api/modules/index.ts 文件，添加新导出的模块')
}

// 检查是否直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = {
  main,
  extractPathInfo,
  generateTypeScriptContent,
  config
}
