/**
 * 大纲生成组合式函数
 * 专注于大纲生成的UI状态和业务逻辑
 */

import { reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { documentGenerateService } from '@/services/documentGenerateService'
import type {
  OutlineGenerationRequest,
  OutlineGenerationResponse,
  OutlineSection,
  Title,
  SearchResultItem
} from '@/types/ai'

/**
 * 大纲生成状态
 */
export interface OutlineGenerationState {
  // 生成状态
  isGenerating: boolean
  progress: number

  // 生成的大纲
  generatedOutline: OutlineSection[]

  // 编辑状态
  isEditing: boolean
  editedSections: Map<string, Partial<OutlineSection>>

  // 配置
  maxDepth: number
  minSections: number
  maxSections: number

  // 错误状态
  error: string | null
}

/**
 * 大纲生成组合式函数
 */
export function useOutlineGeneration() {
  // 状态管理
  const state = reactive<OutlineGenerationState>({
    isGenerating: false,
    progress: 0,
    generatedOutline: [],
    isEditing: false,
    editedSections: new Map(),
    maxDepth: 3,
    minSections: 3,
    maxSections: 10,
    error: null
  })

  // 计算属性
  const hasGeneratedOutline = computed(() => state.generatedOutline.length > 0)
  const sectionCount = computed(() => state.generatedOutline.length)
  const totalWordEstimate = computed(() =>
    state.generatedOutline.reduce(
      (total, section) => total + (section.estimated_word_count || 0),
      0
    )
  )

  const canGenerateOutline = computed(() => !state.isGenerating)
  const canEditOutline = computed(() => hasGeneratedOutline.value && !state.isGenerating)

  // 大纲结构分析
  const outlineStructure = computed(() => {
    const levelCount = new Map<number, number>()
    let totalWords = 0

    state.generatedOutline.forEach((section) => {
      levelCount.set(section.level, (levelCount.get(section.level) || 0) + 1)
      totalWords += section.estimated_word_count || 0
    })

    return {
      levelCount,
      totalWords,
      maxLevel: Math.max(...Array.from(levelCount.keys())),
      minLevel: Math.min(...Array.from(levelCount.keys()))
    }
  })

  // 生成大纲
  const generateOutline = async (
    title: Title,
    researchBrief: string,
    webSearchData: SearchResultItem[]
  ) => {
    if (!title || !researchBrief || !webSearchData) {
      ElMessage.error('缺少必要的输入数据')
      return
    }

    if (researchBrief.length < 10) {
      ElMessage.error('研究简报内容不足，请提供更多信息')
      return
    }

    if (webSearchData.length === 0) {
      ElMessage.error('缺少搜索数据，请先进行搜索')
      return
    }

    state.isGenerating = true
    state.error = null
    state.progress = 0

    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        if (state.progress < 90) {
          state.progress += Math.random() * 12
        }
      }, 600)

      const request: OutlineGenerationRequest = {
        title: title,
        research_brief: researchBrief,
        web_search_data: webSearchData
      }

      const response: OutlineGenerationResponse =
        await documentGenerateService.generateOutline(request)

      clearInterval(progressInterval)
      state.progress = 100

      state.generatedOutline = response.outline

      ElMessage.success(`成功生成 ${response.section_count} 个章节的大纲`)

      return response
    } catch (error) {
      state.error = error instanceof Error ? error.message : '大纲生成失败'
      ElMessage.error(state.error)
      throw error
    } finally {
      state.isGenerating = false
      state.progress = 0
    }
  }

  // 重新生成大纲
  const regenerateOutline = async (
    title: Title,
    researchBrief: string,
    webSearchData: SearchResultItem[]
  ) => {
    // 清空现有大纲
    state.generatedOutline = []

    return generateOutline(title, researchBrief, webSearchData)
  }

  // 编辑章节
  const editSection = (sectionId: string, updates: Partial<OutlineSection>) => {
    state.editedSections.set(sectionId, updates)
    ElMessage.success('章节已更新')
  }

  // 保存编辑
  const saveEdits = () => {
    if (state.editedSections.size === 0) {
      ElMessage.info('没有需要保存的修改')
      return
    }

    // 应用编辑到生成的大纲
    state.generatedOutline = state.generatedOutline.map((section) => {
      const edits = state.editedSections.get(section.title)
      if (edits) {
        return { ...section, ...edits }
      }
      return section
    })

    // 清空编辑缓存
    state.editedSections.clear()

    ElMessage.success('修改已保存')
  }

  // 取消编辑
  const cancelEditing = () => {
    state.editedSections.clear()
    ElMessage.info('编辑已取消')
  }

  // 添加章节
  const addSection = (parentSection?: OutlineSection) => {
    const newSection: OutlineSection = {
      level: parentSection ? parentSection.level + 1 : 1,
      title: '新章节',
      content_direction: '请添加内容方向描述',
      data_requirements: [],
      priority: 'medium',
      sources: []
    }

    state.generatedOutline.push(newSection)
    ElMessage.success('章节已添加')
  }

  // 删除章节
  const removeSection = (section: OutlineSection | any) => {
    const index = state.generatedOutline.indexOf(section as OutlineSection)
    if (index > -1) {
      state.generatedOutline.splice(index, 1)
      ElMessage.success('章节已删除')
    }
  }

  // 移动章节
  const moveSection = (section: OutlineSection, direction: 'up' | 'down') => {
    const index = state.generatedOutline.indexOf(section)
    if (index === -1) return

    if (direction === 'up' && index > 0) {
      // 向上移动
      const temp = state.generatedOutline[index - 1]
      state.generatedOutline[index - 1] = section
      state.generatedOutline[index] = temp
    } else if (direction === 'down' && index < state.generatedOutline.length - 1) {
      // 向下移动
      const temp = state.generatedOutline[index + 1]
      state.generatedOutline[index + 1] = section
      state.generatedOutline[index] = temp
    }

    ElMessage.success(`章节已${direction === 'up' ? '上移' : '下移'}`)
  }

  // 验证大纲
  const validateOutline = () => {
    const errors: string[] = []

    if (state.generatedOutline.length < state.minSections) {
      errors.push(`大纲章节数量不足，至少需要 ${state.minSections} 个章节`)
    }

    if (state.generatedOutline.length > state.maxSections) {
      errors.push(`大纲章节数量过多，最多允许 ${state.maxSections} 个章节`)
    }

    // 检查层级深度
    const maxLevel = Math.max(...state.generatedOutline.map((s) => s.level))
    if (maxLevel > state.maxDepth) {
      errors.push(`大纲层级过深，最大允许层级为 ${state.maxDepth}`)
    }

    // 检查必填字段
    state.generatedOutline.forEach((section, index) => {
      if (!section.title || section.title.trim() === '') {
        errors.push(`第 ${index + 1} 个章节缺少标题`)
      }
      if (!section.content_direction || section.content_direction.trim() === '') {
        errors.push(`第 ${index + 1} 个章节缺少内容方向`)
      }
    })

    if (errors.length > 0) {
      ElMessage.warning(errors.join('；'))
      return false
    }

    ElMessage.success('大纲验证通过')
    return true
  }

  // 导出大纲
  const exportOutline = (format: 'json' | 'markdown' | 'text') => {
    let content = ''

    switch (format) {
      case 'json':
        content = JSON.stringify(state.generatedOutline, null, 2)
        break
      case 'markdown':
        content = state.generatedOutline
          .map(
            (section) =>
              `${'#'.repeat(section.level)} ${section.title}\n\n${section.content_direction}\n`
          )
          .join('\n')
        break
      case 'text':
        content = state.generatedOutline
          .map(
            (section) =>
              `${'  '.repeat(section.level - 1)}${section.title}: ${section.content_direction}`
          )
          .join('\n')
        break
    }

    // 创建下载链接
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `outline.${format}`
    link.click()

    URL.revokeObjectURL(url)
    ElMessage.success(`大纲已导出为 ${format.toUpperCase()} 格式`)
  }

  // 获取大纲工具状态
  const getOutlineToolsStatus = async () => {
    try {
      const status = await documentGenerateService.getOutlineToolsStatus()
      return status
    } catch (error) {
      state.error = error instanceof Error ? error.message : '获取工具状态失败'
      ElMessage.error(state.error)
      throw error
    }
  }

  // 验证大纲生成请求
  const validateOutlineRequest = async (
    title: Title,
    researchBrief: string,
    webSearchData: SearchResultItem[]
  ) => {
    try {
      const request: OutlineGenerationRequest = {
        title: title,
        research_brief: researchBrief,
        web_search_data: webSearchData
      }

      const result = await documentGenerateService.validateOutlineGeneration(request)
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
    state.generatedOutline = []
    state.isEditing = false
    state.editedSections.clear()
    state.error = null
  }

  // 获取章节统计
  const getSectionStats = () => {
    const levelCount = new Map<number, number>()
    const priorityCount = new Map<string, number>()
    let totalWords = 0

    state.generatedOutline.forEach((section) => {
      levelCount.set(section.level, (levelCount.get(section.level) || 0) + 1)
      priorityCount.set(section.priority, (priorityCount.get(section.priority) || 0) + 1)
      totalWords += section.estimated_word_count || 0
    })

    return {
      totalSections: state.generatedOutline.length,
      levelDistribution: Object.fromEntries(levelCount),
      priorityDistribution: Object.fromEntries(priorityCount),
      totalWordEstimate: totalWords
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
    canEditOutline,
    outlineStructure,

    // 方法
    generateOutline,
    regenerateOutline,
    editSection,
    saveEdits,
    cancelEditing,
    addSection,
    removeSection,
    moveSection,
    validateOutline,
    exportOutline,
    getOutlineToolsStatus,
    validateOutlineRequest,
    reset,
    getSectionStats
  }
}

// 类型定义已导出，无需重复导出
// export type { OutlineGenerationState }
