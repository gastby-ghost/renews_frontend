/**
 * 大纲生成组合式函数
 *
 * 职责：专注于大纲生成的 UI 状态管理，不管理业务数据
 *
 * 状态来源：从 useDocumentGenerateStore 获取
 */

import { computed, reactive, watch } from 'vue'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { storeToRefs } from 'pinia'
import type { OutlineSection } from '@/types/ai'

/**
 * 大纲生成组合式函数返回状态
 */
export interface OutlineGenerationState {
  isGenerating: boolean
  progress: number
  error: string | null
  isEditing: boolean
  generatedOutline: OutlineSection[]
}

/**
 * 大纲生成组合式函数
 */
export function useOutlineGeneration() {
  // 获取 Store 状态
  const documentStore = useDocumentGenerateStore()
  const { documentState, loading } = storeToRefs(documentStore)

  // 状态对象
  const state = reactive<OutlineGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    isEditing: false,
    generatedOutline: []
  })

  // 清理过期的标题任务
  const cleanupExpiredOutlineTask = () => {
    documentStore.cleanupExpiredTasks()
  }

  // 同步文档状态到本地状态
  watch(
    () => documentState.value.generatedOutline,
    (newOutline) => {
      // 清理过期任务
      cleanupExpiredOutlineTask()

      state.isGenerating = loading.value && documentState.value.outlineTask?.status === 'running'
      state.progress = documentState.value.outlineTask?.progress || 0
      state.error = documentState.value.outlineTask?.error || null
      state.generatedOutline = newOutline || []
    },
    { immediate: true }
  )

  // 计算属性
  const hasGeneratedOutline = computed(() => state.generatedOutline.length > 0)
  const sectionCount = computed(() => state.generatedOutline.length)
  const totalWordEstimate = computed(() =>
    state.generatedOutline.reduce(
      (total, section) => total + (section.estimated_word_count || 0),
      0
    )
  )
  const canGenerateOutline = computed(() => !loading.value)

  // 大纲结构分析
  const outlineStructure = computed(() => {
    const levelCount = new Map<number, number>()
    let totalWords = 0

    state.generatedOutline.forEach((section) => {
      levelCount.set(section.level, (levelCount.get(section.level) || 0) + 1)
      totalWords += section.estimated_word_count || 0
    })

    return {
      levelCount: Object.fromEntries(levelCount),
      totalWords
    }
  })

  // 添加章节
  const addSection = () => {
    const newSection: OutlineSection = {
      title: '新章节',
      content_direction: '',
      data_requirements: [],
      level: 1,
      estimated_word_count: 500
    }
    state.generatedOutline.push(newSection)
  }

  // 编辑章节
  const editSection = (sectionTitle: string, updates: Partial<OutlineSection>) => {
    const section = state.generatedOutline.find((s) => s.title === sectionTitle)
    if (section) {
      Object.assign(section, updates)
    }
  }

  // 重置大纲
  const reset = () => {
    state.generatedOutline = []
  }

  // 验证大纲
  const validateOutline = (): boolean => {
    if (state.generatedOutline.length === 0) {
      return false
    }

    // 检查是否有空标题
    const hasEmptyTitle = state.generatedOutline.some((section) => !section.title.trim())
    if (hasEmptyTitle) {
      return false
    }

    return true
  }

  // 导出大纲
  const exportOutline = (format: 'json' | 'markdown') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(state.generatedOutline, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'outline.json'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  // 生成大纲
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const generateOutline = async (_title: any, _researchBrief: string, _searchResults: any[]) => {
    // 实际项目中会调用 API
    // 这里先返回模拟数据
    return {
      outline: [
        {
          title: '引言',
          content_direction: '介绍主题背景和重要性',
          data_requirements: ['行业数据', '案例分析'],
          level: 1,
          estimated_word_count: 800
        },
        {
          title: '主要部分',
          content_direction: '详细阐述核心内容',
          data_requirements: ['统计数据', '专家观点'],
          level: 1,
          estimated_word_count: 2000
        }
      ]
    }
  }

  // 获取大纲工具状态
  const getOutlineToolsStatus = async () => {
    return {
      configured: true
    }
  }

  return {
    // 状态
    state,

    // 计算属性
    hasGeneratedOutline,
    sectionCount,
    totalWordEstimate,
    canGenerateOutline,
    outlineStructure,

    // 方法
    addSection,
    editSection,
    reset,
    validateOutline,
    exportOutline,
    generateOutline,
    getOutlineToolsStatus
  }
}
