/**
 * Mock数据统一导出文件
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// Agent相关Mock数据
export * from './data/agent/searchResult'

// 素材相关Mock数据
export * from './data/material/list'

// 搜索相关Mock数据
export * from './data/search/results'

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
        const { generateMockAgentSearchResult } = require('./data/agent/searchResult')
        data = generateMockAgentSearchResult(args[0], args[1])
        break
      }

      case 'agent-services': {
        const { mockAgentServices } = require('./data/agent/searchResult')
        data = mockAgentServices
        break
      }

      case 'agent-capabilities': {
        const { mockAgentCapabilities } = require('./data/agent/searchResult')
        data = mockAgentCapabilities
        break
      }

      case 'material-list': {
        const { generateMockMaterialList } = require('./data/material/list')
        data = generateMockMaterialList(args[0], args[1], args[2])
        break
      }

      case 'material-tags': {
        const { generateMockTags } = require('./data/material/list')
        data = generateMockTags()
        break
      }

      case 'search-result': {
        const { generateMockSearchResult } = require('./data/search/results')
        data = generateMockSearchResult(args[0], args[1], args[2])
        break
      }

      case 'search-tools-result': {
        const { generateMockSearchToolsResult } = require('./data/search/results')
        data = generateMockSearchToolsResult(args[0], args[1], args[2])
        break
      }

      case 'search-providers': {
        const { generateMockSearchProviders } = require('./data/search/results')
        data = generateMockSearchProviders()
        break
      }

      case 'search-tools-status': {
        const { generateMockSearchToolsStatus } = require('./data/search/results')
        data = generateMockSearchToolsStatus()
        break
      }

      case 'library-materials': {
        const { generateMockLibraryMaterials } = require('./data/search/results')
        data = generateMockLibraryMaterials(args[0], args[1], args[2], args[3], args[4])
        break
      }

      case 'material-details': {
        const { generateMockMaterialDetails } = require('./data/search/results')
        data = generateMockMaterialDetails(args[0])
        break
      }

      case 'download-url': {
        const { generateMockDownloadUrl } = require('./data/search/results')
        data = generateMockDownloadUrl(args[0])
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
