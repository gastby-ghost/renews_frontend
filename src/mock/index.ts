/**
 * Mock数据统一导出文件
 */

import { MockTaskTracker } from '@/utils/mockTaskTracker'
import { generateMockMaterialList, generateMockTags } from './data/material/list'
import {
  generateMockSearchToolsStatus,
  generateMockAIProviders,
  generateMockSearchResult,
  generateMockSearchToolsResult,
  generateMockLibraryMaterials,
  generateMockMaterialDetails,
  generateMockDownloadUrl,
  generateMockSearchAgentStatus,
  generateMockSearchAgentResponse,
  generateMockSearchAgentList,
  generateMockSearchToolsResponse,
  generateMockSearchHistory,
  generateMockSearchSuggestions,
  generateMockSearchToolsExecute,
  generateMockSearchToolsTaskStatus
} from './data/search/results'
import {
  generateScopeAgentResponse,
  generateScopeAgentStatusResponse,
  generateScopeAgentListResponse,
  generateSearch2TitleAgentResponse,
  generateSearch2TitleAgentStatusResponse,
  generateSearch2TitleAgentListResponse,
  generateTitleGenerationResponse,
  generateTitleToolsStatusResponse,
  generateOutlineGenerationResponse,
  generateOutlineToolsStatusResponse
} from './data/document-generate'
import {
  generateHealthCheckResponse,
  generateMetricsResponse,
  generateUserPreferencesResponse,
  generateDefaultPreferencesResponse,
  generateRegisterResponse,
  generateVerifyEmailResponse,
  generateForgotPasswordResponse,
  generateAccountResponse,
  generateLogoutResponse,
  generateRefreshTokenResponse,
  generateCleanupResponse
} from './data/auth'
import {
  generateProjectListResponse,
  generateProjectDetailResponse,
  generateProjectCreateResponse,
  generateProjectUpdateResponse,
  generateProjectDeleteResponse,
  generateProjectStatusUpdateResponse,
  generateProjectComponentUpdateResponse,
  generateProjectStatisticsResponse,
  generateProjectDuplicateResponse,
  generateProjectSearchResponse
} from './data/project'
import {
  mockCreateBody,
  mockGetBodies,
  mockGetActiveBody,
  mockGetBodyHistory,
  mockGetBody,
  mockUpdateBody,
  mockDeleteBody,
  mockActivateBody,
  mockDeactivateBody,
  mockGetTextStats,
  mockGetReadabilityAnalysis
} from './data/body'

// 素材相关Mock数据
export * from './data/material/list'

// 搜索相关Mock数据
export * from './data/search/results'

// 文档生成相关Mock数据
export * from './data/document-generate'

// 认证相关Mock数据
export * from './data/auth'

// 项目相关Mock数据
export * from './data/project'

// 大纲相关Mock数据
export * from './data/outline'

// 大纲章节相关Mock数据
export * from './data/outline-section'

// 素材关系相关Mock数据
export * from './data/material-relation'

// 正文相关Mock数据
export * from './data/body'

// 导入文章数据用于内容生成
import articleData from './json/article.json'

// 导出 MockTaskTracker 类
export { MockTaskTracker }

// Mock数据管理器
export class MockDataManager {
  private static instance: MockDataManager
  private dataCache: Map<string, any> = new Map()

  static getInstance(): MockDataManager {
    if (!MockDataManager.instance) {
      MockDataManager.instance = new MockDataManager()
    }
    return MockDataManager.instance
  }

  /**
   * 获取Mock数据
   * @description 状态查询接口（-status结尾）不使用缓存，确保返回最新的任务状态
   */
  getMockData(key: string, ...args: any[]): any {
    const cacheKey = `${key}-${JSON.stringify(args)}`
    const isStatusQuery = key.includes('-status')

    // 状态查询接口不使用缓存，直接生成新数据
    if (!isStatusQuery && this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey)
    }

    let data: any

    // 根据不同的数据类型key，调用对应的Mock数据生成函数
    switch (key) {
      case 'material-list': {
        // 生成素材列表Mock数据
        // 参数: 页码, 每页数量, 筛选条件
        data = generateMockMaterialList(args[0], args[1], args[2])
        break
      }

      case 'material-tags': {
        // 生成素材标签Mock数据
        data = generateMockTags()
        break
      }

      case 'search-tools-status': {
        data = generateMockSearchToolsStatus()
        break
      }

      case 'search-tools-config-status': {
        data = generateMockSearchToolsStatus()
        break
      }

      case 'search-providers': {
        data = generateMockAIProviders()
        break
      }

      case 'search-tools': {
        // 生成搜索工具响应Mock数据
        // 参数: 查询数组, 提供商
        data = generateMockSearchToolsResponse(args[0] || ['默认查询'], args[1] || 'tavily')
        break
      }

      case 'search-agent-execute': {
        // 生成搜索代理执行Mock数据
        // 参数: 用户ID, 项目ID, 简报内容
        data = generateMockSearchAgentResponse(args[0], args[1], args[2])
        break
      }

      case 'search-agent-status': {
        // 生成搜索代理状态Mock数据
        // 参数: 任务ID, 简报内容(可选)
        console.log('执行了获取agent状态函数')
        data = generateMockSearchAgentStatus(args[0], args[1])
        break
      }

      case 'search-agent-list': {
        // 生成搜索代理列表Mock数据
        // 参数: 用户ID, 项目ID(可选), 简报内容(可选)
        data = generateMockSearchAgentList(args[0], args[1], args[2])
        break
      }

      case 'search-result': {
        // 生成搜索结果Mock数据
        // 参数: 搜索关键词, 页码, 每页数量
        data = generateMockSearchResult(args[0], args[1], args[2])
        break
      }

      case 'search-tools-result': {
        // 生成搜索工具结果Mock数据
        // 参数: 搜索关键词, 工具类型
        data = generateMockSearchToolsResult(args[0], args[1])
        break
      }

      case 'search-history': {
        // 生成搜索历史Mock数据
        // 参数: 限制数量
        data = generateMockSearchHistory(args[0] || 10)
        break
      }

      case 'search-suggestions': {
        // 生成搜索建议Mock数据
        // 参数: 查询关键词
        data = generateMockSearchSuggestions(args[0] || '')
        break
      }

      case 'search-results': {
        // 生成搜索结果Mock数据
        // 参数: 搜索关键词数组
        const keywords = Array.isArray(args[0]) ? args[0][0] || '默认搜索' : args[0] || '默认搜索'
        data = generateMockSearchResult(keywords, 1, 20)
        break
      }

      case 'search-tools-tasks': {
        // 生成搜索工具任务列表Mock数据
        // 参数: 用户ID, 项目ID
        const userId = args[0] || 'user_123'
        const projectId = args[1]
        data = generateMockSearchAgentList(userId, projectId, '搜索工具任务')
        break
      }

      case 'search-tools-execute': {
        // 生成搜索工具执行Mock数据
        // 参数: 请求数据
        data = generateMockSearchToolsExecute(args[0] || {})
        break
      }

      case 'search-tools-task-status': {
        // 生成搜索工具任务状态Mock数据
        // 参数: 任务ID
        data = generateMockSearchToolsTaskStatus(args[0] || '')
        break
      }

      case 'library-materials': {
        // 生成库素材Mock数据
        // 参数: 标签数组, 页码, 每页数量
        data = generateMockLibraryMaterials(args[0], args[1], args[2])
        break
      }

      case 'material-details': {
        // 生成素材详情Mock数据
        // 参数: 素材ID
        data = generateMockMaterialDetails(args[0])
        break
      }

      case 'download-url': {
        // 生成下载链接Mock数据
        // 参数: 素材ID
        data = generateMockDownloadUrl(args[0])
        break
      }

      // ========== 文档生成相关Mock数据 ==========
      case 'scope-agent-execute': {
        // 生成Scope Agent执行Mock数据
        // 参数: 用户ID, 项目ID, 查询内容
        data = generateScopeAgentResponse(args[0], args[1])
        break
      }

      case 'scope-agent-status': {
        // 生成Scope Agent状态Mock数据
        // 参数: 任务ID
        data = generateScopeAgentStatusResponse(args[0])
        break
      }

      case 'scope-agent-list': {
        // 生成Scope Agent列表Mock数据
        // 参数: 用户ID, 项目ID(可选)
        data = generateScopeAgentListResponse(args[0], args[1])
        break
      }

      case 'search2title-agent-execute': {
        // 生成Search2Title Agent执行Mock数据
        // 参数: 用户ID, 项目ID, 简报内容
        data = generateSearch2TitleAgentResponse(args[0], args[1], args[2])
        break
      }

      case 'search2title-agent-status': {
        // 生成Search2Title Agent状态Mock数据
        // 参数: 任务ID, 简报内容(可选)
        data = generateSearch2TitleAgentStatusResponse(args[0], args[1])
        break
      }

      case 'search2title-agent-list': {
        // 生成Search2Title Agent列表Mock数据
        // 参数: 用户ID, 项目ID(可选)
        data = generateSearch2TitleAgentListResponse(args[0], args[1])
        break
      }

      case 'title-generation': {
        // 生成标题生成Mock数据
        data = generateTitleGenerationResponse()
        break
      }

      case 'title-tools-status': {
        // 生成标题工具状态Mock数据
        data = generateTitleToolsStatusResponse()
        break
      }

      case 'outline-generation': {
        // 生成大纲生成Mock数据
        data = generateOutlineGenerationResponse()
        break
      }

      case 'outline-tools-status': {
        // 生成大纲工具状态Mock数据
        data = generateOutlineToolsStatusResponse()
        break
      }

      // ========== 认证相关Mock数据 ==========
      case 'auth-health': {
        // 生成基础健康检查Mock数据
        // 参数: 健康检查类型 (basic/detailed/ready/live)
        data = generateHealthCheckResponse(args[0] || 'basic')
        break
      }

      case 'auth-metrics': {
        // 生成服务指标Mock数据
        data = generateMetricsResponse()
        break
      }

      case 'auth-preferences': {
        // 生成用户偏好设置Mock数据
        data = generateUserPreferencesResponse()
        break
      }

      case 'auth-default-preferences': {
        // 生成默认偏好设置Mock数据
        data = generateDefaultPreferencesResponse()
        break
      }

      case 'auth-register': {
        // 生成注册响应Mock数据
        // 参数: username, email, password
        data = generateRegisterResponse(args[0] || {})
        break
      }

      case 'auth-verify': {
        // 生成邮箱验证Mock数据
        // 参数: verification token
        data = generateVerifyEmailResponse(args[0] || '')
        break
      }

      case 'auth-forgot-password': {
        // 生成忘记密码Mock数据
        // 参数: email
        data = generateForgotPasswordResponse(args[0] || '')
        break
      }

      case 'auth-account': {
        // 生成账户信息Mock数据
        data = generateAccountResponse()
        break
      }

      case 'auth-logout': {
        // 生成登出响应Mock数据
        data = generateLogoutResponse()
        break
      }

      case 'auth-refresh-token': {
        // 生成刷新令牌Mock数据
        // 参数: refreshToken
        data = generateRefreshTokenResponse(args[0] || '')
        break
      }

      case 'auth-cleanup': {
        // 生成清理过期令牌Mock数据
        data = generateCleanupResponse()
        break
      }

      // ========== 项目相关Mock数据 ==========
      case 'project-list': {
        // 生成项目列表Mock数据
        data = generateProjectListResponse()
        break
      }

      case 'project-detail': {
        // 生成项目详情Mock数据
        // 参数: 项目ID
        data = generateProjectDetailResponse(args[0] || 1)
        break
      }

      case 'project-create': {
        // 生成项目创建Mock数据
        // 参数: 项目名称
        data = generateProjectCreateResponse(args[0] || '新项目')
        break
      }

      case 'project-update': {
        // 生成项目更新Mock数据
        // 参数: 项目ID, 更新数据
        data = generateProjectUpdateResponse(args[0] || 1, args[1] || {})
        break
      }

      case 'project-delete': {
        // 生成项目删除Mock数据
        // 参数: 项目ID数组
        data = generateProjectDeleteResponse(args[0] || [1])
        break
      }

      case 'project-status-update': {
        // 生成项目状态更新Mock数据
        // 参数: 项目ID, 新状态
        data = generateProjectStatusUpdateResponse(args[0] || 1, args[1] || 'TITLE_GENERATION')
        break
      }

      case 'project-component-update': {
        // 生成项目组件更新Mock数据
        // 参数: 项目ID, 新组件
        data = generateProjectComponentUpdateResponse(args[0] || 1, args[1] || 'topic-selection')
        break
      }

      case 'project-statistics': {
        // 生成项目统计Mock数据
        data = generateProjectStatisticsResponse()
        break
      }

      case 'project-duplicate': {
        // 生成项目复制Mock数据
        // 参数: 原始项目ID, 新名称
        data = generateProjectDuplicateResponse(args[0] || 1, args[1] || '项目副本')
        break
      }

      case 'project-search': {
        // 生成项目搜索Mock数据
        // 参数: 搜索关键词
        data = generateProjectSearchResponse(args[0] || '')
        break
      }

      // ========== 正文相关Mock数据 ==========
      case 'body-create': {
        // 创建正文
        // 参数: 项目ID, 正文数据
        data = mockCreateBody(args[0] || 1, args[1] || {})
        break
      }

      case 'bodies-get': {
        // 获取项目的所有正文（分页）
        // 参数: 项目ID, skip, limit
        data = mockGetBodies(args[0] || 1, args[1] || 0, args[2] || 100)
        break
      }

      case 'body-active': {
        // 获取活动正文
        // 参数: 项目ID
        data = mockGetActiveBody(args[0] || 1)
        break
      }

      case 'body-history': {
        // 获取正文历史
        // 参数: 项目ID, skip, limit
        data = mockGetBodyHistory(args[0] || 1, args[1] || 0, args[2] || 100)
        break
      }

      case 'body-detail': {
        // 获取正文详情
        // 参数: 正文ID
        data = mockGetBody(args[0] || 1)
        break
      }

      case 'body-update': {
        // 更新正文
        // 参数: 正文ID, 更新数据
        data = mockUpdateBody(args[0] || 1, args[1] || {})
        break
      }

      case 'body-delete': {
        // 删除正文（停用）
        // 参数: 正文ID
        data = mockDeleteBody(args[0] || 1)
        break
      }

      case 'body-activate': {
        // 激活正文
        // 参数: 正文ID, 激活数据
        data = mockActivateBody(args[0] || 1, args[1] || {})
        break
      }

      case 'body-deactivate': {
        // 停用正文
        // 参数: 正文ID
        data = mockDeactivateBody(args[0] || 1)
        break
      }

      case 'body-text-stats': {
        // 获取文本统计
        // 参数: 正文ID
        data = mockGetTextStats(args[0] || 1)
        break
      }

      case 'body-readability': {
        // 获取可读性分析
        // 参数: 正文ID
        data = mockGetReadabilityAnalysis(args[0] || 1)
        break
      }

      // ========== 内容生成相关Mock数据 ==========
      case 'content-generate-execute': {
        // 执行内容生成
        // 参数: title, format, length
        data = {
          task_id: `content_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'processing',
          message: '内容生成任务已启动',
          created_at: new Date().toISOString(),
          request: {
            title: args[0] || '默认标题',
            format: args[1] || 'markdown',
            length: args[2] || 'medium'
          }
        }
        break
      }

      case 'content-validate': {
        // 内容验证
        // 参数: title, keywordsCount, audience, purpose
        data = {
          valid: true,
          score: 85,
          issues: [],
          suggestions: ['标题具有较好的吸引力', '关键词密度适中', '目标受众定位明确'],
          validated_at: new Date().toISOString()
        }
        break
      }

      case 'content-task-status': {
        // 内容生成任务状态
        // 参数: taskId
        const taskId = args[0] || 'default_task'
        const timestamp = Date.now()

        // 根据taskId的长度和时间戳模拟不同状态
        const hash = taskId.length + (timestamp % 100)
        let status, progress, result

        if (hash < 30) {
          status = 'processing'
          progress = hash * 3
        } else if (hash < 60) {
          status = 'processing'
          progress = 60 + (hash - 30) * 1.5
        } else if (hash < 90) {
          status = 'completed'
          progress = 100
          result = {
            title: '人工智能在医疗领域的革命性突破',
            content: articleData.data?.content || '# 生成的内容\n\n这是通过AI生成的示例内容...',
            word_count: 1568,
            format: 'markdown',
            generated_at: new Date().toISOString()
          }
        } else {
          status = 'failed'
          progress = 0
          result = {
            error: '内容生成失败，请重试',
            error_code: 'GENERATION_FAILED'
          }
        }

        data = {
          task_id: taskId,
          status,
          progress,
          message:
            status === 'completed'
              ? '内容生成完成'
              : status === 'failed'
                ? '内容生成失败'
                : `正在生成内容... ${Math.round(progress)}%`,
          created_at: new Date(timestamp - 30000).toISOString(),
          updated_at: new Date().toISOString(),
          result
        }
        break
      }

      default:
        // 处理未知的Mock数据类型请求
        throw new Error(`未知的Mock数据类型: ${key}`)
    }

    // 只有非状态查询的数据才缓存
    if (!isStatusQuery) {
      this.dataCache.set(cacheKey, data)
    }
    return data
  }

  /**
   * 清除缓存
   */
  clearCache(key?: string): void {
    if (key) {
      // 清除特定key的缓存
      for (const cacheKey of this.dataCache.keys()) {
        if (cacheKey.startsWith(key)) {
          this.dataCache.delete(cacheKey)
        }
      }
    } else {
      // 清除所有缓存
      this.dataCache.clear()
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { total: number; keys: string[] } {
    return {
      total: this.dataCache.size,
      keys: Array.from(this.dataCache.keys())
    }
  }

  /**
   * 获取缓存数据（带TTL支持）
   */
  getData(key: string): any {
    const cached = this.dataCache.get(key)
    if (cached && cached.expireTime && Date.now() > cached.expireTime) {
      this.dataCache.delete(key)
      return null
    }
    return cached ? cached.data : null
  }

  /**
   * 设置缓存数据（带TTL支持）
   */
  setData(key: string, data: any, ttlSeconds?: number): void {
    if (ttlSeconds) {
      this.dataCache.set(key, {
        data,
        expireTime: Date.now() + ttlSeconds * 1000
      })
    } else {
      this.dataCache.set(key, {
        data,
        expireTime: null
      })
    }
  }
}

// 导出单例实例
export const mockDataManager = MockDataManager.getInstance()
