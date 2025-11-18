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

// 素材绑定相关Mock
import { bindMaterialsWithAIMock, getMaterialBindStatusMock } from './agents/material-bind'

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

/**
 * Mock路由映射表
 * 格式：[HTTP方法:路径, Mock处理函数]
 */
export const mockRoutes = new Map([
  // Scope Agent 路由（添加 /api/v1/ai/document_generate 前缀）
  ['POST:/api/v1/ai/document_generate/scope-agent/execute', executeScopeAgentMock],
  ['GET:/api/v1/ai/document_generate/scope-agent/status/:taskId', getScopeAgentStatusMock],
  ['GET:/api/v1/ai/document_generate/scope-agent/tasks', getScopeAgentTasksMock],

  // Title Agent 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/title-agent/generate', generateTitlesMock],
  ['GET:/api/v1/ai/title-agent/status', getTitleToolsStatusMock],

  // Outline Agent 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/outline-agent/generate', generateOutlineMock],
  ['GET:/api/v1/ai/outline-agent/status', getOutlineToolsStatusMock],

  // Search2Title Agent 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/search2title/execute', search2TitleMock],

  // Material Bind 路由（添加 /api/v1/ai 前缀）
  ['POST:/api/v1/ai/bind-materials', bindMaterialsWithAIMock],
  ['GET:/api/v1/ai/material-bind/status/:taskId', getMaterialBindStatusMock],

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
  ['DELETE:/api/v1/core/projects/:projectId/title-versions/:versionId', deleteTitleVersionMock]
])

/**
 * 构建路由键值
 * @param config API请求配置
 * @returns 路由键值
 */
export function buildRouteKey(config: { method: string; url: string }): string {
  let routeKey = `${config.method.toUpperCase()}:${config.url}`

  // 参数化路径匹配，将动态参数替换为通用标识符
  routeKey = routeKey.replace(/\/\d+/g, '/:id') // 数字ID替换
  routeKey = routeKey.replace(/\/tasks\/[^/]+/g, '/tasks/:taskId') // 任务ID替换
  routeKey = routeKey.replace(/\/status\/[^/]+/g, '/status/:taskId') // 任务状态ID替换（支持花括号和普通路径）
  routeKey = routeKey.replace(/\/cancel\/[^/]+/g, '/cancel/:taskId') // 任务取消ID替换
  routeKey = routeKey.replace(/\/projects\/[^/]+/g, '/projects/:projectId') // 项目ID替换
  routeKey = routeKey.replace(/\/briefs\/[^/]+/g, '/briefs/:briefId') // 简报ID替换
  routeKey = routeKey.replace(/\/title-candidates\/[^/]+/g, '/title-candidates/:candidateId') // 标题候选ID替换
  routeKey = routeKey.replace(/\/title-versions\/[^/]+/g, '/title-versions/:versionId') // 版本ID替换

  return routeKey
}

/**
 * 获取Mock处理器
 * @param config API请求配置
 * @returns Mock处理函数或null
 */
export function getMockHandler(config: { method: string; url: string }) {
  const routeKey = buildRouteKey(config)
  return mockRoutes.get(routeKey) || null
}
