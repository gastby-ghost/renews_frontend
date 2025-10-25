/**
 * Mock数据统一导出文件
 */

// 素材相关Mock数据
export * from './data/material/list'

// 搜索相关Mock数据
export * from './data/search/results'

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
  generateMockSearchToolsResponse
} from './data/search/results'

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

      default:
        // 处理未知的Mock数据类型请求
        throw new Error(`未知的Mock数据类型: ${key}`)
    }

    // 将生成的数据存入缓存，提高后续访问性能
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
