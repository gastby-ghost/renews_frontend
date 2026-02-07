#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * AI OpenAPI 3.1.0 到 TypeScript API 配置转换器
 * 将 ai_openapi 中的 JSON 文件转换为 src/config/api/modules/ai 中的 TypeScript 文件
 */

const fs = require('fs')
const path = require('path')

// 获取当前文件所在目录
const __dirname = path.dirname(process.cwd())

// 配置
const config = {
  inputDir: path.join(__dirname, '../ai_openapi'),
  outputDir: path.join(__dirname, '../src/config/api/modules/ai'),
  templateDir: path.join(__dirname, '../src/config/api')
}

/**
 * 提取 AI OpenAPI 路径信息并转换为 API 配置格式
 */
function extractPathInfo(openapiSpec) {
  const paths = openapiSpec.paths || {}
  const result = {}

  Object.entries(paths).forEach(([pathKey, pathValue]) => {
    Object.entries(pathValue).forEach(([method, methodConfig]) => {
      // 构建路径配置
      result[pathKey] = {
        description:
          methodConfig.summary || methodConfig.description || `${method.toUpperCase()} ${pathKey}`,
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
      const existingKey = Object.keys(result).find(
        (key) => key === pathKey && result[key] !== result[pathKey]
      )
      if (existingKey) {
        const existingEntry = result[existingKey]
        if (!existingEntry.methods.includes(method.toUpperCase())) {
          existingEntry.methods.push(method.toUpperCase())
          existingEntry.methods.sort()
        }
        delete result[pathKey] // 删除重复的
      }
    })
  })

  return result
}

/**
 * 检查是否需要认证
 */
function hasAuthRequirement(security) {
  if (!security || !Array.isArray(security)) return false
  return security.some(
    (sec) => sec.HTTPBearer || sec.BearerAuth || sec.ApiKeyAuth || sec.Authorization
  )
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
    } else if (content && content.schema) {
      params.body = '请求体数据结构'
    }
  }

  // 提取路径和查询参数
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
  if (!successResponse || !successResponse.content) return 'Response'

  const content = successResponse.content['application/json']
  if (content && content.schema && content.schema.$ref) {
    return content.schema.$ref.split('/').pop()
  } else if (content && content.schema && content.schema.title) {
    return content.schema.title
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

import type { ApiEndpointConfig } from '../../types'

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
    'content-generate': 'AI正文生成服务',
    'material-bind': 'AI素材绑定服务',
    'outline-generate': 'AI大纲生成服务',
    'outline-with-material': 'AI带素材大纲生成服务',
    'scope-agent': 'AI范围代理服务',
    'search-agent': 'AI搜索代理服务',
    'search-tools': 'AI搜索工具服务',
    'search2title-agent': 'AI搜索标题代理服务',
    'title-generate': 'AI标题生成服务'
  }
  return nameMap[fileName] || `${fileName}服务`
}

/**
 * 从文件名获取服务键名
 */
function getServiceKey(fileName) {
  const keyMap = {
    'content-generate': 'contentGenerateService',
    'material-bind': 'materialBindService',
    'outline-generate': 'outlineGenerateService',
    'outline-with-material': 'outlineWithMaterialService',
    'scope-agent': 'scopeAgentService',
    'search-agent': 'searchAgentService',
    'search-tools': 'searchToolsService',
    'search2title-agent': 'search2titleAgentService',
    'title-generate': 'titleGenerateService'
  }
  return keyMap[fileName] || `${fileName.replace(/-/g, '')}Service`
}

/**
 * 提取基础URL
 */
function extractBaseUrl(openapiSpec) {
  const servers = openapiSpec.servers
  if (servers && servers.length > 0) {
    const serverUrl = servers[0].url
    if (serverUrl.startsWith('/')) {
      return serverUrl
    }
    try {
      return new URL(serverUrl).pathname
    } catch {
      // 如果无法解析URL，尝试提取路径部分
      const pathMatch = serverUrl.match(/\/api\/[^/]*/)
      return pathMatch ? pathMatch[0] : '/api/v1/ai'
    }
  }

  // 从路径中推断基础URL
  const paths = Object.keys(openapiSpec.paths || {})
  if (paths.length > 0) {
    const firstPath = paths[0]
    const match = firstPath.match(/(\/api\/[^/]*\/[^/]*)/)
    if (match) {
      return match[1]
    }
  }

  return '/api/v1/ai'
}

/**
 * 生成 AI 模块索引文件
 */
function generateIndexFile(services) {
  const imports = services
    .map((service) => `import { ${service.key} } from './${service.file}'`)
    .join('\n')

  const exports = services.map((service) => `  ${service.key}`).join(',\n')

  const apiModules = services.map((service) => `  ${service.name}: ${service.key}`).join(',\n')

  return `/**
 * AI服务模块API配置导出文件
 * 集中管理所有AI服务模块配置
 */

${imports}

export const AI_API_MODULES = {
${apiModules}
} as const

export type AiApiModuleName = keyof typeof AI_API_MODULES

export {
${exports}
}
`
}

/**
 * 主函数
 */
function main() {
  console.log('🤖 开始转换 AI OpenAPI 规范到 TypeScript 配置...\n')

  // 确保输出目录存在
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true })
  }

  // 读取所有 AI OpenAPI 文件
  const files = fs.readdirSync(config.inputDir).filter((file) => file.endsWith('.json'))

  console.log(`📁 找到 ${files.length} 个 AI OpenAPI 文件:`)
  files.forEach((file) => console.log(`   - ${file}`))
  console.log('')

  // 转换每个文件
  const results = []
  const services = []
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

      services.push({
        file: fileName,
        name: fileName.replace(/-/g, ''),
        key: getServiceKey(fileName)
      })

      console.log(`✅ ${file} → ${fileName}.ts (${Object.keys(pathInfo).length} 个API端点)`)
    } catch (error) {
      console.error(`❌ ${file} 转换失败:`, error.message)
      results.push({ file: path.basename(file, '.json'), success: false, error: error.message })
    }
  })

  // 生成索引文件
  if (services.length > 0) {
    const indexContent = generateIndexFile(services)
    const indexPath = path.join(config.outputDir, 'index.ts')
    fs.writeFileSync(indexPath, indexContent)
    console.log(`✅ 生成索引文件: index.ts`)
  }

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

  console.log('\n🎉 AI 模块转换完成！')
  console.log(`📂 输出目录: ${config.outputDir}`)

  // 提示更新主 index.ts
  console.log('\n💡 提示: 请手动更新 src/config/api/index.ts 文件，添加 AI_API_MODULES 的引用')
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
