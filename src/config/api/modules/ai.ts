/**
 * AI服务模块API配置
 * 基于OpenAPI规范自动生成
 * 包含网页总结、检索、搜索工具、标题生成、大纲生成等功能
 *
 * 注意：此文件已重构为模块化结构，各子服务已分离到独立模块文件中
 * 为了保持向后兼容性，此文件仍然导出合并后的配置
 */

import type { ApiEndpointConfig } from '../types'
import { webpageSummaryService } from './webpage-summary'
import { retrievalService } from './retrieval'
import { tasksService } from './tasks'
import { scopeAgentService } from './scope-agent'
import { searchAgentService } from './search-agent'
import { searchToolsService } from './search-tools'
import { titleGenerateService } from './title-generate'
import { outlineGenerateService } from './outline-generate'
import { healthService } from './health'

/**
 * AI智能服务 - 合并所有AI子服务配置
 *
 * 各子服务已分离到独立模块：
 * - webpage-summary: 网页总结服务 (/webpage-summary/*)
 * - retrieval: 检索服务 (/retrieval/*)
 * - tasks: 任务管理服务 (/tasks/*)
 * - scope-agent: Scope Agent服务 (/scope-agent/*)
 * - search-agent: Search Agent服务 (/search-agent/*)
 * - search-tools: 搜索工具服务 (/search-tools/*)
 * - title-generate: 标题生成服务 (/title-generate/*)
 * - outline-generate: 大纲生成服务 (/outline-generate/*)
 * - health: 系统健康检查 (/health)
 *
 * 建议：新代码优先使用独立的子服务模块，以获得更好的类型检查和模块化支持
 */
export const aiService: ApiEndpointConfig = {
  name: 'AI智能服务',
  baseUrl: '/api/v1/ai',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  enableMock: true,
  mockPath: '/mock/data/ai',
  defaults: {
    timeout: 30000, // AI服务可能需要更长时间
    headers: {
      'Content-Type': 'application/json'
    },
    retryCount: 1,
    enableCache: false
  },
  paths: {
    // 合并所有子服务的路径配置
    ...webpageSummaryService.paths,
    ...retrievalService.paths,
    ...tasksService.paths,
    ...scopeAgentService.paths,
    ...searchAgentService.paths,
    ...searchToolsService.paths,
    ...titleGenerateService.paths,
    ...outlineGenerateService.paths,
    ...healthService.paths
  }
}
