/**
 * 标题生成组合式函数
 * 专注于标题生成的UI状态和业务逻辑
 */

import { reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { documentGenerateService } from '@/services/documentGenerateService'
import type {
  TitleGenerationRequest,
  TitleGenerationResponse,
  Title,
  SearchResultItem
} from '@/types/ai'

/**
 * 标题生成状态
 */
export interface TitleGenerationState {
  // 生成状态
  isGenerating: boolean
  progress: number

  // 生成的标题
  generatedTitles: Title[]

  // 选中的标题
  selectedTitle: Title | null

  // 配置
  titleCount: number
  titleLength: 'short' | 'medium' | 'long'
  stylePreference: 'news' | 'academic' | 'creative' | 'professional'

  // 关键词
  extractedKeywords: string[]
  customKeywords: string[]

  // 错误状态
  error: string | null
}

/**
 * 标题生成组合式函数
 */
export function useTitleGeneration() {
  // 状态管理
  const state = reactive<TitleGenerationState>({
    isGenerating: false,
    progress: 0,
    generatedTitles: [],
    selectedTitle: null,
    titleCount: 5,
    titleLength: 'medium',
    stylePreference: 'news',
    extractedKeywords: [],
    customKeywords: [],
    error: null
  })

  // 计算属性
  const hasGeneratedTitles = computed(() => state.generatedTitles.length > 0)
  const hasSelectedTitle = computed(() => state.selectedTitle !== null)
  const hasKeywords = computed(
    () => state.extractedKeywords.length > 0 || state.customKeywords.length > 0
  )

  const canGenerateTitles = computed(() => !state.isGenerating)

  // 生成标题
  const generateTitles = async (researchBrief: string, webSearchData?: SearchResultItem[]) => {
    if (!researchBrief || researchBrief.length < 10) {
      ElMessage.error('研究简报内容不足，请提供更多信息')
      return
    }

    state.isGenerating = true
    state.error = null
    state.progress = 0

    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        if (state.progress < 90) {
          state.progress += Math.random() * 15
        }
      }, 500)

      const request: TitleGenerationRequest = {
        research_brief: researchBrief,
        web_search_data: webSearchData || []
      }

      const response: TitleGenerationResponse =
        await documentGenerateService.generateTitles(request)

      clearInterval(progressInterval)
      state.progress = 100

      state.generatedTitles = response.titles

      ElMessage.success(`成功生成 ${response.title_count} 个标题选项`)

      return response
    } catch (error) {
      state.error = error instanceof Error ? error.message : '标题生成失败'
      ElMessage.error(state.error)
      throw error
    } finally {
      state.isGenerating = false
      state.progress = 0
    }
  }

  // 重新生成标题
  const regenerateTitles = async (researchBrief: string, webSearchData?: SearchResultItem[]) => {
    // 清空现有标题
    state.generatedTitles = []
    state.selectedTitle = null

    return generateTitles(researchBrief, webSearchData)
  }

  // 选择标题
  const selectTitle = (title: Title) => {
    state.selectedTitle = title
    ElMessage.success('标题已选择')
  }

  // 取消选择标题
  const deselectTitle = () => {
    state.selectedTitle = null
  }

  // 添加自定义关键词
  const addCustomKeyword = (keyword: string) => {
    if (keyword && !state.customKeywords.includes(keyword)) {
      state.customKeywords.push(keyword)
      ElMessage.success(`已添加关键词: ${keyword}`)
    }
  }

  // 移除自定义关键词
  const removeCustomKeyword = (keyword: string) => {
    const index = state.customKeywords.indexOf(keyword)
    if (index > -1) {
      state.customKeywords.splice(index, 1)
      ElMessage.success(`已移除关键词: ${keyword}`)
    }
  }

  // 提取关键词
  const extractKeywords = (text: string) => {
    // 简单的关键词提取逻辑
    const words = text.toLowerCase().split(/\s+/)
    const keywords = words.filter(
      (word) =>
        word.length > 3 &&
        ![
          'the',
          'and',
          'for',
          'are',
          'but',
          'not',
          'you',
          'all',
          'can',
          'had',
          'her',
          'was',
          'one',
          'our',
          'out',
          'day',
          'get',
          'has',
          'him',
          'his',
          'how',
          'man',
          'new',
          'now',
          'old',
          'see',
          'two',
          'way',
          'who',
          'boy',
          'did',
          'its',
          'let',
          'put',
          'say',
          'she',
          'too',
          'use'
        ].includes(word)
    )

    // 去重并取前10个
    const uniqueKeywords = [...new Set(keywords)].slice(0, 10)
    state.extractedKeywords = uniqueKeywords

    ElMessage.success(`提取了 ${uniqueKeywords.length} 个关键词`)
  }

  // 获取标题工具状态
  const getTitleToolsStatus = async () => {
    try {
      const status = await documentGenerateService.getTitleToolsStatus()
      return status
    } catch (error) {
      state.error = error instanceof Error ? error.message : '获取工具状态失败'
      ElMessage.error(state.error)
      throw error
    }
  }

  // 验证标题生成请求
  const validateTitleRequest = async (
    researchBrief: string,
    webSearchData?: SearchResultItem[]
  ) => {
    try {
      const request: TitleGenerationRequest = {
        research_brief: researchBrief,
        web_search_data: webSearchData || []
      }

      const result = await documentGenerateService.validateTitleGeneration(request)
      return result
    } catch (error) {
      state.error = error instanceof Error ? error.message : '验证请求失败'
      ElMessage.error(state.error)
      throw error
    }
  }

  // 重置状态
  const reset = () => {
    state.isGenerating = false
    state.progress = 0
    state.generatedTitles = []
    state.selectedTitle = null
    state.titleCount = 5
    state.titleLength = 'medium'
    state.stylePreference = 'news'
    state.extractedKeywords = []
    state.customKeywords = []
    state.error = null
  }

  // 比较标题
  const compareTitles = (titles: Title[]) => {
    if (titles.length < 2) {
      ElMessage.warning('请选择至少2个标题进行比较')
      return
    }

    // 这里可以实现标题比较逻辑
    ElMessage.success(`正在比较 ${titles.length} 个标题`)
  }

  // 获取标题评分
  const getTitleScore = (title: Title) => {
    // 基于新闻价值标准计算评分
    const newsValuesScore = (title.news_values?.length || 0) * 20
    const verifiabilityScore = title.verifiability?.includes('容易')
      ? 30
      : title.verifiability?.includes('中等')
        ? 20
        : 10
    const feasibilityScore = title.feasibility?.includes('高')
      ? 30
      : title.feasibility?.includes('中')
        ? 20
        : 10

    return Math.min(100, newsValuesScore + verifiabilityScore + feasibilityScore)
  }

  // 获取标题建议
  const getTitleSuggestions = (title: Title) => {
    const suggestions = []

    if ((title.news_values?.length || 0) < 3) {
      suggestions.push('建议增加更多新闻价值要素')
    }

    if (!title.verifiability?.includes('容易')) {
      suggestions.push('考虑提高标题的可验证性')
    }

    if (title.risk_notes?.includes('风险')) {
      suggestions.push('注意评估潜在风险')
    }

    return suggestions
  }

  return {
    // 状态
    state,

    // 计算属性
    hasGeneratedTitles,
    hasSelectedTitle,
    hasKeywords,
    canGenerateTitles,

    // 方法
    generateTitles,
    regenerateTitles,
    selectTitle,
    deselectTitle,
    addCustomKeyword,
    removeCustomKeyword,
    extractKeywords,
    getTitleToolsStatus,
    validateTitleRequest,
    reset,
    compareTitles,
    getTitleScore,
    getTitleSuggestions
  }
}

// 类型定义已导出，无需重复导出
// export type { TitleGenerationState }
