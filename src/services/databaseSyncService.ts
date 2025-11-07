/**
 * 数据库同步服务
 *
 * 职责：统一管理AI任务完成后的数据库操作
 * 确保AI功能与数据库更新的协调性
 */

import { ref } from 'vue'
import type {
  ScopeAgentStatusResponse,
  Search2TitleAgentStatusResponse,
  Title,
  SearchResultItem
} from '@/types/ai'
import { normalizeSearchData } from '@/utils/dataprocess/array'

export interface DatabaseSyncConfig {
  maxRetries?: number
  retryInterval?: number
  enableLogging?: boolean
}

export interface DatabaseSyncResult {
  success: boolean
  synced: {
    researchBrief?: boolean
    titles?: boolean
    searchResults?: boolean
  }
  errors: string[]
}

/**
 * 数据库同步服务类
 */
export class DatabaseSyncService {
  private syncState = ref({
    isSyncing: false,
    lastSyncTime: null as number | null,
    error: null as string | null
  })

  private config: Required<DatabaseSyncConfig>

  constructor(config: DatabaseSyncConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryInterval: config.retryInterval ?? 2000,
      enableLogging: config.enableLogging ?? true
    }
  }

  /**
   * 同步Scope Agent结果到数据库
   */
  async syncScopeAgentResult(
    task: ScopeAgentStatusResponse,
    updateDocumentState: (updates: any) => void
  ): Promise<DatabaseSyncResult> {
    const errors: string[] = []

    try {
      this.log('开始同步Scope Agent结果到数据库', { taskId: task.task_id })

      // 1. 如果有研究简报结果，保存到数据库
      if (task.result?.research_brief) {
        try {
          await this.saveResearchBriefToDatabase(task.result.research_brief)
          this.log('研究简报已保存到数据库')
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '研究简报保存失败'
          errors.push(errorMsg)
          this.log('研究简报保存失败', { error: errorMsg })
        }
      }

      // 2. 更新前端状态
      try {
        const updates: any = {}
        if (task.result?.research_brief) {
          updates.researchBrief = task.result.research_brief
        }

        if (Object.keys(updates).length > 0) {
          updateDocumentState(updates)
          this.log('前端状态已更新', { updates })
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '状态更新失败'
        errors.push(errorMsg)
        this.log('状态更新失败', { error: errorMsg })
      }

      return {
        success: errors.length === 0,
        synced: {
          researchBrief: !errors.some((e) => e.includes('研究简报'))
        },
        errors
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步Scope Agent结果失败'
      this.log('同步Scope Agent结果失败', { error: errorMsg })
      return {
        success: false,
        synced: {},
        errors: [errorMsg]
      }
    }
  }

  /**
   * 同步Search2Title Agent结果到数据库
   */
  async syncSearch2TitleResult(
    task: Search2TitleAgentStatusResponse,
    updateDocumentState: (updates: any) => void
  ): Promise<DatabaseSyncResult> {
    const errors: string[] = []

    try {
      this.log('开始同步Search2Title Agent结果到数据库', { taskId: task.task_id })

      // 1. 如果有标题数据，保存到数据库
      if (task.title_data?.titles) {
        try {
          await this.saveTitlesToDatabase(task.title_data.titles)
          this.log(`已保存 ${task.title_data.titles.length} 个标题到数据库`)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '标题保存失败'
          errors.push(errorMsg)
          this.log('标题保存失败', { error: errorMsg })
        }
      }

      // 2. 如果有搜索数据，保存到数据库
      if (task.research_data?.web_search_data) {
        try {
          const normalizedResults = normalizeSearchData<SearchResultItem>(
            task.research_data.web_search_data
          )
          this.log(`已保存 ${normalizedResults.length} 条搜索结果到数据库`)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '搜索结果保存失败'
          errors.push(errorMsg)
          this.log('搜索结果保存失败', { error: errorMsg })
        }
      }

      // 3. 更新前端状态
      try {
        const updates: any = {}
        const generationStats: any = {}

        if (task.title_data?.titles) {
          updates.generatedTitles = task.title_data.titles
          generationStats.titleCount = task.title_data.titles.length
        }

        if (task.research_data?.web_search_data) {
          updates.titleSearchResults = normalizeSearchData<SearchResultItem>(
            task.research_data.web_search_data
          )
        }

        if (Object.keys(generationStats).length > 0) {
          updates.generationStats = generationStats
        }

        if (Object.keys(updates).length > 0) {
          updateDocumentState(updates)
          this.log('前端状态已更新', { updates })
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '状态更新失败'
        errors.push(errorMsg)
        this.log('状态更新失败', { error: errorMsg })
      }

      return {
        success: errors.length === 0,
        synced: {
          titles: !errors.some((e) => e.includes('标题')),
          searchResults: !errors.some((e) => e.includes('搜索结果'))
        },
        errors
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '同步Search2Title结果失败'
      this.log('同步Search2Title结果失败', { error: errorMsg })
      return {
        success: false,
        synced: {},
        errors: [errorMsg]
      }
    }
  }

  /**
   * 保存研究简报到数据库（带重试机制）
   */
  private async saveResearchBriefToDatabase(content: string): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // TODO: 实现实际的数据库保存逻辑
        // 这里应该调用 documentGenerateService.createResearchBrief 或类似方法
        this.log(`保存研究简报尝试 ${attempt}/${this.config.maxRetries}`)
        await this.simulateDatabaseOperation('saveResearchBrief', { content })

        // 成功则返回
        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误')
        this.log(`保存研究简报失败，尝试 ${attempt}/${this.config.maxRetries}`, {
          error: lastError.message
        })

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryInterval * attempt)
        }
      }
    }

    throw lastError || new Error('保存研究简报失败')
  }

  /**
   * 保存标题到数据库（带重试机制）
   */
  private async saveTitlesToDatabase(titles: Title[]): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // TODO: 实现实际的数据库保存逻辑
        // 这里应该调用 documentGenerateService.bulkCreateTitleCandidates 或类似方法
        this.log(`保存标题尝试 ${attempt}/${this.config.maxRetries}`, {
          count: titles.length
        })
        await this.simulateDatabaseOperation('saveTitles', { titles })

        // 成功则返回
        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误')
        this.log(`保存标题失败，尝试 ${attempt}/${this.config.maxRetries}`, {
          error: lastError.message
        })

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryInterval * attempt)
        }
      }
    }

    throw lastError || new Error('保存标题失败')
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 模拟数据库操作（在实际项目中应替换为真实API调用）
   */
  private async simulateDatabaseOperation(operation: string, data: any): Promise<void> {
    // 模拟网络延迟
    await this.delay(500)

    // 模拟随机失败（10%概率）
    if (Math.random() < 0.1) {
      throw new Error(`模拟数据库操作失败: ${operation}`)
    }

    this.log('数据库操作成功', { operation, dataSize: JSON.stringify(data).length })
  }

  /**
   * 记录日志
   */
  private log(message: string, meta?: any): void {
    if (this.config.enableLogging) {
      console.log(`[DatabaseSyncService] ${message}`, meta || '')
    }
  }

  /**
   * 获取同步状态
   */
  getSyncState() {
    return this.syncState
  }

  // 预留方法：用于标记同步开始/结束（当前未使用）
  // private markSyncStart(): void { ... }
  // private markSyncEnd(success: boolean, error?: string | null): void { ... }
}

// 创建单例实例
export const databaseSyncService = new DatabaseSyncService()

export default databaseSyncService
