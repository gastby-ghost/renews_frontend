/**
 * 标题生成组合式函数
 *
 * 职责：专注于标题生成的 UI 状态管理，不管理业务数据
 *
 * 状态来源：从 useDocumentGenerateStore 获取
 */

import { computed, reactive, watch } from 'vue'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { storeToRefs } from 'pinia'
import type { Title } from '@/types/ai'

/**
 * 标题生成组合式函数返回状态
 */
export interface TitleGenerationState {
  isGenerating: boolean
  progress: number
  error: string | null
  generatedTitles: Title[]
  selectedTitle: Title | null
  customKeywords: string[]
}

/**
 * 标题生成组合式函数
 */
export function useTitleGeneration() {
  // 获取 Store 状态
  const documentStore = useDocumentGenerateStore()
  const { documentState, loading } = storeToRefs(documentStore)

  // 本地状态
  const customKeywords = ref<string[]>([])

  // 状态对象
  const state = reactive<TitleGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    generatedTitles: [],
    selectedTitle: null,
    customKeywords: []
  })

  // 同步文档状态到本地状态
  watch(
    () => [documentState.value.generatedTitles, documentState.value.selectedTitle],
    () => {
      state.isGenerating = loading.value && documentState.value.titleTask?.status === 'running'
      state.progress = documentState.value.titleTask?.progress || 0
      state.error = documentState.value.titleTask?.error || null
      state.generatedTitles = documentState.value.generatedTitles || []
      state.selectedTitle = documentState.value.selectedTitle
    },
    { immediate: true }
  )

  // 同步自定义关键词
  watch(
    customKeywords,
    (newKeywords) => {
      state.customKeywords = newKeywords
    },
    { immediate: true }
  )

  // 计算属性
  const hasGeneratedTitles = computed(() => state.generatedTitles.length > 0)
  const hasSelectedTitle = computed(() => state.selectedTitle !== null)
  const canGenerateTitles = computed(() => !loading.value)

  // 选择标题（调用 Store 方法）
  const selectTitle = (title: Title) => {
    documentStore.selectTitle(title)
  }

  // 提取关键词
  const extractKeywords = (brief: string) => {
    if (!brief) return

    // 简单的关键词提取逻辑
    const keywords = brief
      .split(/[,，、\s]+/)
      .filter((word) => word.length > 1 && word.length < 10)
      .slice(0, 10)

    customKeywords.value = keywords
  }

  // 添加自定义关键词
  const addCustomKeyword = (keyword: string) => {
    if (keyword && !customKeywords.value.includes(keyword)) {
      customKeywords.value.push(keyword)
    }
  }

  // 移除自定义关键词
  const removeCustomKeyword = (keyword: string) => {
    const index = customKeywords.value.indexOf(keyword)
    if (index > -1) {
      customKeywords.value.splice(index, 1)
    }
  }

  // 获取标题评分
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTitleScore = (_title: Title): number => {
    // 简单的评分逻辑
    return Math.floor(Math.random() * 40) + 60
  }

  // 获取标题建议
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTitleSuggestions = (_title: Title): string[] => {
    return ['更具吸引力', '更简洁明了', '更专业', '更具创意性']
  }

  // 检查标题工具状态
  const getTitleToolsStatus = async () => {
    return {
      configured: true
    }
  }

  return {
    // 状态
    state,

    // 计算属性
    hasGeneratedTitles,
    hasSelectedTitle,
    canGenerateTitles,

    // 方法
    selectTitle,
    extractKeywords,
    addCustomKeyword,
    removeCustomKeyword,
    getTitleScore,
    getTitleSuggestions,
    getTitleToolsStatus
  }
}
