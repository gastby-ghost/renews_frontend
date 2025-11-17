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
  generateMockSearchSuggestions
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
