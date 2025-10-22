/**
 * Mock数据统一导出文件
 */

// Agent相关Mock数据
export * from './data/agent/searchResult'

// 素材相关Mock数据
export * from './data/material/list'

// 搜索相关Mock数据
export * from './data/search/results'

// AI服务相关Mock数据
export * from './data/ai'

// 导入所有Mock数据生成函数
import {
  generateMockAgentSearchResult,
  mockAgentServices,
  mockAgentCapabilities
} from './data/agent/searchResult'

import { generateMockMaterialList, generateMockTags } from './data/material/list'

import {
  generateMockSearchResult,
  generateMockSearchToolsResult,
  generateMockSearchProviders,
  generateMockSearchToolsStatus,
  generateMockLibraryMaterials,
  generateMockMaterialDetails,
  generateMockDownloadUrl
} from './data/search/results'

import {
  generateMockWebpageSummaryAsync,
  generateMockWebpageSummaryStatus,
  generateMockScopeAgentResponse,
  generateMockScopeAgentStatus,
  generateMockScopeAgentList,
  generateMockSearchAgentResponse,
  generateMockSearchAgentStatus,
  generateMockSearchAgentList,
  generateMockSearchToolsResponse,
  generateMockSearchToolsStatus,
  generateMockTitleGenerationResponse,
  generateMockTitleToolsStatus,
  generateMockOutlineGenerationResponse,
  generateMockOutlineToolsStatus,
  generateMockAIProviders
} from './data/ai'

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
   */
  getMockData(key: string, ...args: any[]): any {
    const cacheKey = `${key}-${JSON.stringify(args)}`

    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey)
    }

    let data: any

    switch (key) {
      case 'agent-search-result': {
        data = generateMockAgentSearchResult(args[0], args[1])
        break
      }

      case 'agent-services': {
        data = mockAgentServices
        break
      }

      case 'agent-capabilities': {
        data = mockAgentCapabilities
        break
      }

      case 'material-list': {
        data = generateMockMaterialList(args[0], args[1], args[2])
        break
      }

      case 'material-tags': {
        data = generateMockTags()
        break
      }

      case 'search-result': {
        data = generateMockSearchResult(args[0], args[1], args[2])
        break
      }

      case 'search-tools-result': {
        data = generateMockSearchToolsResult(args[0], args[1], args[2])
        break
      }

      case 'search-providers': {
        data = generateMockSearchProviders()
        break
      }

      case 'search-tools-status': {
        data = generateMockSearchToolsStatus()
        break
      }

      case 'library-materials': {
        data = generateMockLibraryMaterials(args[0], args[1], args[2], args[3], args[4])
        break
      }

      case 'material-details': {
        data = generateMockMaterialDetails(args[0])
        break
      }

      case 'download-url': {
        data = generateMockDownloadUrl(args[0])
        break
      }

      // AI服务Mock数据
      case 'ai-webpage-summary-async': {
        data = generateMockWebpageSummaryAsync(args[0])
        break
      }

      case 'ai-webpage-summary-status': {
        data = generateMockWebpageSummaryStatus(args[0])
        break
      }

      case 'ai-scope-agent-execute': {
        data = generateMockScopeAgentResponse(args[0], args[1], args[2])
        break
      }

      case 'ai-scope-agent-status': {
        data = generateMockScopeAgentStatus(args[0])
        break
      }

      case 'ai-scope-agent-list': {
        data = generateMockScopeAgentList(args[0], args[1])
        break
      }

      case 'ai-search-agent-execute': {
        data = generateMockSearchAgentResponse(args[0], args[1], args[2])
        break
      }

      case 'ai-search-agent-status': {
        data = generateMockSearchAgentStatus(args[0])
        break
      }

      case 'ai-search-agent-list': {
        data = generateMockSearchAgentList(args[0], args[1])
        break
      }

      case 'ai-search-tools': {
        data = generateMockSearchToolsResponse(args[0], args[1])
        break
      }

      case 'ai-search-tools-status': {
        data = generateMockSearchToolsStatus()
        break
      }

      case 'ai-title-generation': {
        data = generateMockTitleGenerationResponse(args[0], args[1])
        break
      }

      case 'ai-title-tools-status': {
        data = generateMockTitleToolsStatus()
        break
      }

      case 'ai-outline-generation': {
        data = generateMockOutlineGenerationResponse(args[0], args[1], args[2])
        break
      }

      case 'ai-outline-tools-status': {
        data = generateMockOutlineToolsStatus()
        break
      }

      case 'ai-providers': {
        data = generateMockAIProviders()
        break
      }

      default:
        throw new Error(`未知的Mock数据类型: ${key}`)
    }

    // 缓存数据
    this.dataCache.set(cacheKey, data)
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
}

// 导出单例实例
export const mockDataManager = MockDataManager.getInstance()
