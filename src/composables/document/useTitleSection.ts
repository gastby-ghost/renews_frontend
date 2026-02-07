/**
 * 标题分区组合式函数
 * 处理标题显示、评分、建议等逻辑
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import type { Material } from '@/types/core/material'

/**
 * 标题类型（组件内部使用）
 */
interface Title {
  id?: string | number
  title: string
  description?: string
  sources?: string[]
  summary?: string
  url?: string
  tags?: string[]
  published_date?: string
  score?: number
  key_excerpts?: string[]
}

export interface UseTitleSectionOptions {
  projectId: string
  selectedMaterials?: Material[]
}

export function useTitleSection(options: UseTitleSectionOptions) {
  const router = useRouter()
  const documentStore = useDocumentGenerateStore()

  // Props
  const projectId = computed(() => options.projectId)
  const selectedMaterials = computed(() => options.selectedMaterials || [])

  // ====== 计算属性 ======

  /** 当前选中标题 */
  const selectedTitle = computed(() => documentStore.documentState.selectedTitle)

  /** 标题搜索结果 */
  const titleSearchResults = computed(() => documentStore.documentState.titleSearchResults)

  /** 当前选中标题对应的素材列表 */
  const titleRelatedMaterials = computed(() => {
    if (!selectedTitle.value) return []

    const selectedSources = selectedTitle.value.sources || []

    if (selectedSources.length > 0 && titleSearchResults.value) {
      const searchResults = Array.isArray(titleSearchResults.value)
        ? titleSearchResults.value.filter((item: any) => typeof item === 'object' && item !== null)
        : []

      if (searchResults.length === 0) {
        return []
      }

      return searchResults
        .filter((_: any, index: number) => selectedSources.includes(index.toString()))
        .map((result: any) => ({
          id: `search-${result.query || 'unknown'}-${Math.random().toString(36).substring(2, 9)}`,
          title: result.aititle || '',
          summary: result.summary || '',
          url: result.url,
          tags: result.tags || [],
          createdAt: result.published_date ? new Date(result.published_date) : new Date(),
          score: result.score,
          key_excerpts: result.key_excerpts || [],
          content: '',
          type: 'article' as const,
          user_id: ''
        }))
    }

    return []
  })

  /** 合并的素材列表（标题相关素材 + 用户选择的素材） */
  const allMaterials = computed(() => {
    const titleMaterials = titleRelatedMaterials.value
    const userSelectedMaterials = selectedMaterials.value

    // 去重，基于标题和URL
    const allUniqueMaterials = [...titleMaterials]

    userSelectedMaterials.forEach((userMaterial) => {
      const exists = allUniqueMaterials.some(
        (existing) =>
          existing.title === userMaterial.title ||
          (existing.url && userMaterial.url && existing.url === userMaterial.url)
      )
      if (!exists) {
        allUniqueMaterials.push(userMaterial)
      }
    })

    return allUniqueMaterials
  })

  /** 是否已完成标题选择 */
  const isTitleCompleted = computed(() => !!selectedTitle.value)

  // ====== 方法 ======

  /** 获取标题评分 */
  const getTitleScore = (): number => {
    return Math.floor(Math.random() * 40) + 60
  }

  /** 获取标题建议 */
  const getTitleSuggestions = (): string[] => {
    return ['更具吸引力', '更简洁明了', '更专业', '更具创意性']
  }

  /** 处理标题选择事件 */
  const handleTitleSelect = () => {
    ElMessage.info('当前标题已确认，如需更改请重新选择')
  }

  /** 处理标题更新事件 */
  const handleTitleUpdate = (oldTitle: Title, newTitle: Title) => {
    documentStore.updateDocumentState({
      selectedTitle: newTitle
    })
    ElMessage.success('标题已更新')
  }

  /** 编辑标题 */
  const editTitle = () => {
    router.push(`/document-generation/topic-selection/${projectId.value}`)
  }

  /** 查看搜索结果 */
  const viewSearchResults = () => {
    ElMessage.info('查看搜索结果功能开发中...')
  }

  /** 返回选题页面 */
  const goBackToTitleSelection = () => {
    router.push(`/document-generation/topic-selection/${projectId.value}`)
  }

  return {
    // 状态
    projectId,
    selectedMaterials,
    selectedTitle,
    titleRelatedMaterials,
    allMaterials,
    isTitleCompleted,

    // 方法
    getTitleScore,
    getTitleSuggestions,
    handleTitleSelect,
    handleTitleUpdate,
    editTitle,
    viewSearchResults,
    goBackToTitleSelection
  }
}
