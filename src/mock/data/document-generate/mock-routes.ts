/**
 * Mock路由配置
 * 将所有Mock API路由统一管理，替代服务文件中的分发逻辑
 */

// Agent相关Mock
import {
  executeScopeAgentMock,
  getScopeAgentStatusMock,
  getScopeAgentTasksMock
} from './agents/scope-agent'

import { generateTitlesMock, getTitleToolsStatusMock } from './agents/title-agent'

import { generateOutlineMock, getOutlineToolsStatusMock } from './agents/outline-agent'

import { search2TitleMock } from './agents/search2title-agent'
import { generateSearch2TitleAgentStatusResponse } from './index'

// 素材绑定相关Mock
import { bindMaterialsWithAIMock, getMaterialBindStatusMock } from './agents/material-bind'

// 大纲与素材集成相关Mock
import {
  generateOutlineWithMaterialResponse,
  generateTaskStatusMock
} from './agents/outline-with-material-agent'

// Core相关Mock
import {
  createResearchBriefMock,
  getProjectBriefsMock,
  updateResearchBriefMock,
  deleteResearchBriefMock
} from './core/research-brief'

import {
  createTitleCandidateMock,
  getTitleCandidatesMock,
  updateTitleCandidateMock,
  deleteTitleCandidateMock
} from './core/title-candidate'

import {
  createTitleVersionMock,
  getTitleVersionsMock,
  updateTitleVersionMock,
  deleteTitleVersionMock
} from './core/title-version'

// 搜索工具相关Mock
import { mockDataManager } from '../../index'
import {
  generateMockSearchAgentResponse,
  generateMockSearchAgentStatus,
  generateMockMaterialsResponse
} from '../search/results'

// Content相关Mock
import {
  mockCreateBody,
  mockGetActiveBody,
  mockGetBodyHistory,
  mockUpdateBody,
  mockDeleteBody,
  mockActivateBody,
  mockDeactivateBody,
  mockGetTextStats,
  mockGetReadabilityAnalysis
} from '../body'

// 搜索代理执行Mock处理函数
const executeSearchAgentMock = (config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 执行搜索代理', config)
  const { userId, projectId, brief } = config.data || {}
  return generateMockSearchAgentResponse(userId, projectId, brief)
}

// 搜索代理状态查询Mock处理函数
const getSearchAgentStatusMock = (config: { method: string; url: string }) => {
  console.log('[Mock] 获取搜索代理状态', config)
  // 从URL中提取taskId
  const url = config.url || ''
  const taskIdMatch = url.match(/\/status\/([^/]+)/)
  const taskId = taskIdMatch ? taskIdMatch[1] : ''
  return generateMockSearchAgentStatus(taskId)
}

// 搜索工具执行Mock处理函数
const executeSearchToolsMock = (config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 执行搜索工具', config)
  return mockDataManager.getMockData('search-tools-execute', config.data)
}

// 搜索工具状态查询Mock处理函数
const getSearchToolsStatusMock = (config: { method: string; url: string }) => {
  console.log('[Mock] 获取搜索工具状态', config)
  // 从URL中提取taskId
  const url = config.url || ''
  const taskIdMatch = url.match(/\/status\/([^/]+)/)
  const taskId = taskIdMatch ? taskIdMatch[1] : ''
  return mockDataManager.getMockData('search-tools-task-status', taskId)
}

// 素材库Mock处理函数
const getMaterialsMock = (config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 获取素材库', config)
  return generateMockMaterialsResponse()
}

// Content生成Mock处理函数
const createContentMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 创建内容', { url, config })
  // 从URL中提取projectId
  const projectIdMatch = url.match(/\/projects\/(\d+)\/bodies/)
  const projectId = projectIdMatch ? parseInt(projectIdMatch[1]) : 1
  return mockCreateBody(projectId, config.data || {})
}

// 获取活动内容Mock处理函数
const getActiveContentMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 获取活动内容', { url, config })
  // 从URL中提取projectId
  const projectIdMatch = url.match(/\/projects\/(\d+)\/bodies\/active/)
  const projectId = projectIdMatch ? parseInt(projectIdMatch[1]) : 1
  return mockGetActiveBody(projectId)
}

// 获取内容历史Mock处理函数
const getContentHistoryMock = (
  url: string,
  config: { method: string; url: string; data?: any }
) => {
  console.log('[Mock] 获取内容历史', { url, config })
  // 从URL中提取projectId
  const projectIdMatch = url.match(/\/projects\/(\d+)\/bodies/)
  const projectId = projectIdMatch ? parseInt(projectIdMatch[1]) : 1
  return mockGetBodyHistory(projectId, config.data?.skip || 0, config.data?.limit || 100)
}

// 获取所有内容Mock处理函数
const getBodiesMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 获取所有内容', { url, config })
  // 从URL中提取projectId
  const projectIdMatch = url.match(/\/projects\/(\d+)\/bodies/)
  const projectId = projectIdMatch ? parseInt(projectIdMatch[1]) : 1
  return mockGetBodies(projectId, config.data?.skip || 0, config.data?.limit || 100)
}

// 获取内容详情Mock处理函数
const getContentDetailMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 获取内容详情', { url, config })
  // 从URL中提取bodyId
  const bodyIdMatch = url.match(/\/bodies\/(\d+)/)
  const bodyId = bodyIdMatch ? parseInt(bodyIdMatch[1]) : 1
  return mockGetBody(bodyId)
}

// 更新内容Mock处理函数
const updateContentMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 更新内容', { url, config })
  // 从URL中提取bodyId
  const bodyIdMatch = url.match(/\/bodies\/(\d+)/)
  const bodyId = bodyIdMatch ? parseInt(bodyIdMatch[1]) : 1
  return mockUpdateBody(bodyId, config.data || {})
}

// 删除内容Mock处理函数
const deleteContentMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 删除内容', { url, config })
  // 从URL中提取bodyId
  const bodyIdMatch = url.match(/\/bodies\/(\d+)/)
  const bodyId = bodyIdMatch ? parseInt(bodyIdMatch[1]) : 1
  return mockDeleteBody(bodyId)
}

// 激活内容Mock处理函数
const activateContentMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 激活内容', { url, config })
  // 从URL中提取bodyId
  const bodyIdMatch = url.match(/\/bodies\/(\d+)\/activate/)
  const bodyId = bodyIdMatch ? parseInt(bodyIdMatch[1]) : 1
  return mockActivateBody(bodyId, config.data || {})
}

// 停用内容Mock处理函数
const deactivateContentMock = (
  url: string,
  config: { method: string; url: string; data?: any }
) => {
  console.log('[Mock] 停用内容', { url, config })
  // 从URL中提取bodyId
  const bodyIdMatch = url.match(/\/bodies\/(\d+)\/deactivate/)
  const bodyId = bodyIdMatch ? parseInt(bodyIdMatch[1]) : 1
  return mockDeactivateBody(bodyId)
}

// 获取文本统计Mock处理函数
const getTextStatsMock = (url: string, config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 获取文本统计', { url, config })
  // 从URL中提取bodyId
  const bodyIdMatch = url.match(/\/bodies\/(\d+)\/stats/)
  const bodyId = bodyIdMatch ? parseInt(bodyIdMatch[1]) : 1
  return mockGetTextStats(bodyId)
}

// 获取可读性分析Mock处理函数
const getReadabilityAnalysisMock = (
  url: string,
  config: { method: string; url: string; data?: any }
) => {
  console.log('[Mock] 获取可读性分析', { url, config })
  // 从URL中提取bodyId
  const bodyIdMatch = url.match(/\/bodies\/(\d+)\/readability/)
  const bodyId = bodyIdMatch ? parseInt(bodyIdMatch[1]) : 1
  return mockGetReadabilityAnalysis(bodyId)
}

// Content Generate Mock处理函数
const generateContentMock = (config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 生成内容', config)
  return mockDataManager.getMockData('content-generate-execute', config.data)
}

// 获取内容任务状态Mock处理函数
const getContentTaskStatusMock = (config: { method: string; url: string }) => {
  console.log('[Mock] 获取内容生成任务状态', config)
  // 从URL中提取taskId
  const url = config.url || ''
  const taskIdMatch = url.match(/\/tasks\/([^/]+)/)
  const taskId = taskIdMatch ? taskIdMatch[1] : ''
  return mockDataManager.getMockData('content-task-status', taskId)
}

// 取消内容任务Mock处理函数
const cancelContentTaskMock = (config: { method: string; url: string }) => {
  console.log('[Mock] 取消内容生成任务', config)
  // 从URL中提取taskId
  const url = config.url || ''
  const taskIdMatch = url.match(/\/tasks\/([^/]+)/)
  const taskId = taskIdMatch ? taskIdMatch[1] : ''
  return {
    success: true,
    message: '内容生成任务已取消',
    task_id: taskId,
    cancelled_at: new Date().toISOString(),
    mock: true,
    timestamp: Date.now()
  }
}

// 获取内容工具状态Mock处理函数
const getContentToolsStatusMock = (config: { method: string; url: string }) => {
  console.log('[Mock] 获取内容生成工具状态', config)
  return mockDataManager.getMockData('content-tools-status')
}

// 验证内容生成请求Mock处理函数
const validateContentRequestMock = (config: { method: string; url: string; data?: any }) => {
  console.log('[Mock] 验证内容生成请求', config)
  return mockDataManager.getMockData('content-validate', config.data)
}

// 获取内容任务列表Mock处理函数
const getContentTasksMock = (config: { method: string; url: string }) => {
  console.log('[Mock] 获取内容生成任务列表', config)
  return mockDataManager.getMockData('content-tasks')
}

/**
 * Mock路由映射表
 * 格式：[HTTP方法:路径, Mock处理函数]
 */
export const mockRoutes = new Map<string, any>([
  // Scope Agent 路由（添加 /api/v1/ai/document_generate 前缀）
  ['POST:/api/v1/ai/document_generate/scope-agent/execute', executeScopeAgentMock],
  ['GET:/api/v1/ai/document_generate/scope-agent/status/:taskId', getScopeAgentStatusMock],
  ['GET:/api/v1/ai/document_generate/scope-agent/tasks', getScopeAgentTasksMock],

  // Title Agent 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/document_generate/title-agent/generate', generateTitlesMock],
  ['GET:/api/v1/ai/document_generate/title-agent/status', getTitleToolsStatusMock],

  // Outline Agent 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/document_generate/outline-agent/generate', generateOutlineMock],
  ['GET:/api/v1/ai/document_generate/outline-agent/status', getOutlineToolsStatusMock],

  // Search2Title Agent 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/search2title/execute', search2TitleMock],
  [
    'GET:/api/v1/ai/document_generate/search2title-agent/status/:taskId',
    generateSearch2TitleAgentStatusResponse
  ],

  // Material Bind 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/document_generate/material-bind/execute', bindMaterialsWithAIMock],
  ['GET:/api/v1/ai/document_generate/material-bind/status/:taskId', getMaterialBindStatusMock],

  // Outline With Material 路由（添加 /api/v1/ai 前缀）
  [
    'POST:/api/v1/ai/document_generate/outline-with-material/generate',
    generateOutlineWithMaterialResponse
  ],
  ['GET:/api/v1/ai/document_generate/outline-with-material/task/:taskId', generateTaskStatusMock],

  // Search Tools 路由
  ['POST:/api/v1/ai/search-tools/execute', executeSearchToolsMock],
  ['GET:/api/v1/ai/search-tools/status/:taskId', getSearchToolsStatusMock],

  // Search Agent 路由
  ['POST:/api/v1/ai/search-agent/execute', executeSearchAgentMock],
  ['GET:/api/v1/ai/search-agent/status/:taskId', getSearchAgentStatusMock],

  // Content Generate 路由
  ['POST:/api/v1/ai/document_generate/content/generate', generateContentMock],
  ['GET:/api/v1/ai/document_generate/content/tasks/:taskId', getContentTaskStatusMock],
  ['DELETE:/api/v1/ai/document_generate/content/tasks/:taskId', cancelContentTaskMock],
  ['GET:/api/v1/ai/document_generate/content/status', getContentToolsStatusMock],
  ['POST:/api/v1/ai/document_generate/content/validate', validateContentRequestMock],
  ['GET:/api/v1/ai/document_generate/content/tasks', getContentTasksMock],

  // Core API 路由
  ['POST:/api/v1/core/projects/:projectId/briefs', createResearchBriefMock],
  ['GET:/api/v1/core/projects/:projectId/briefs', getProjectBriefsMock],
  ['PUT:/api/v1/core/projects/:projectId/briefs/:briefId', updateResearchBriefMock],
  ['DELETE:/api/v1/core/projects/:projectId/briefs/:briefId', deleteResearchBriefMock],

  ['POST:/api/v1/core/projects/:projectId/title-candidates', createTitleCandidateMock],
  ['GET:/api/v1/core/projects/:projectId/title-candidates', getTitleCandidatesMock],
  ['PUT:/api/v1/core/projects/:projectId/title-candidates/:candidateId', updateTitleCandidateMock],
  [
    'DELETE:/api/v1/core/projects/:projectId/title-candidates/:candidateId',
    deleteTitleCandidateMock
  ],

  ['POST:/api/v1/core/projects/:projectId/title-versions', createTitleVersionMock],
  ['GET:/api/v1/core/projects/:projectId/title-versions', getTitleVersionsMock],
  ['PUT:/api/v1/core/projects/:projectId/title-versions/:versionId', updateTitleVersionMock],
  ['DELETE:/api/v1/core/projects/:projectId/title-versions/:versionId', deleteTitleVersionMock],

  // Bodies/Content 相关路由
  ['POST:/api/v1/core/bodies/projects/:projectId/bodies', createContentMock],
  ['GET:/api/v1/core/bodies/projects/:projectId/bodies', getBodiesMock],
  ['GET:/api/v1/core/bodies/projects/:projectId/bodies/active', getActiveContentMock],
  ['GET:/api/v1/core/bodies/projects/:projectId/bodies/history', getContentHistoryMock],
  ['GET:/api/v1/core/bodies/bodies/:bodyId', getContentDetailMock],
  ['PUT:/api/v1/core/bodies/bodies/:bodyId', updateContentMock],
  ['DELETE:/api/v1/core/bodies/bodies/:bodyId', deleteContentMock],
  ['PUT:/api/v1/core/bodies/bodies/:bodyId/activate', activateContentMock],
  ['PUT:/api/v1/core/bodies/bodies/:bodyId/deactivate', deactivateContentMock],
  ['GET:/api/v1/core/bodies/bodies/:bodyId/stats', getTextStatsMock],
  ['GET:/api/v1/core/bodies/bodies/:bodyId/readability', getReadabilityAnalysisMock],

  // 素材库路由
  ['GET:/api/v1/core/materials', getMaterialsMock]
] as const)

/**
 * 构建路由键值
 * @param config API请求配置
 * @returns 路由键值
 */
export function buildRouteKey(config: { method: string; url: string }): string {
  let url = config.url

  // 移除协议和主机部分，只保留路径
  if (url.includes('://')) {
    url = url.split('://')[1].split('/').slice(1).join('/')
    url = '/' + url
  }

  let routeKey = `${config.method.toUpperCase()}:${url}`

  // 参数化路径匹配，将动态参数替换为通用标识符
  routeKey = routeKey.replace(/\/\d+/g, '/:id') // 数字ID替换
  routeKey = routeKey.replace(/\/tasks\/[^/]+/g, '/tasks/:taskId') // 任务ID替换
  routeKey = routeKey.replace(/\/status\/[^/]+/g, '/status/:taskId') // 任务状态ID替换（支持花括号和普通路径）
  routeKey = routeKey.replace(/\/cancel\/[^/]+/g, '/cancel/:taskId') // 任务取消ID替换
  routeKey = routeKey.replace(/\/projects\/[^/]+/g, '/projects/:projectId') // 项目ID替换
  routeKey = routeKey.replace(/\/briefs\/[^/]+/g, '/briefs/:briefId') // 简报ID替换
  routeKey = routeKey.replace(/\/title-candidates\/[^/]+/g, '/title-candidates/:candidateId') // 标题候选ID替换
  routeKey = routeKey.replace(/\/title-versions\/[^/]+/g, '/title-versions/:versionId') // 版本ID替换
  routeKey = routeKey.replace(/\/bodies\/[^/]+/g, '/bodies/:bodyId') // 正文ID替换
  routeKey = routeKey.replace(
    /\/document_generate\/content\/tasks\/[^/]+/g,
    '/document_generate/content/tasks/:taskId'
  ) // Content Generate 任务ID替换
  routeKey = routeKey.replace(
    /\/outline-with-material\/task\/[^/]+/g,
    '/outline-with-material/task/:taskId'
  ) // Outline With Material 任务ID替换

  return routeKey
}

/**
 * 获取Mock处理器
 * @param config API请求配置
 * @returns Mock处理函数或null
 */
export function getMockHandler(config: { method: string; url: string }) {
  console.log(`[Mock路由] 原始请求: ${config.method} ${config.url}`)

  const routeKey = buildRouteKey(config)
  console.log(`[Mock路由] 构建的键值: ${routeKey}`)

  const handler = mockRoutes.get(routeKey)

  if (handler) {
    console.log(`[Mock路由] 找到匹配的处理器`)
    return handler
  }

  console.log(`[Mock路由] 未找到匹配的路由，可用路由:`, Array.from(mockRoutes.keys()))
  return null
}
