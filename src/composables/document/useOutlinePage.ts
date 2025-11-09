import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useOutlineStore } from '@/store/modules/outline'
import { useOutlineSectionStore } from '@/store/modules/outlineSection'
import { useMaterialRelationStore } from '@/store/modules/materialRelation'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useProjectStore } from '@/store/modules/project'
import { storeToRefs } from 'pinia'
import type { Material } from '@/types/material'
import type { OutlineSection } from '@/types/ai'
import documentGenerateService from '@/services/documentGenerateService'
import type { OutlineSectionCreate } from '@/services/outlineSectionService'

/**
 * 大纲管理状态接口
 */
interface OutlineState {
  // UI状态
  isGenerating: boolean
  progress: number
  error: string | null
  isEditing: boolean
  isBindingMaterials: boolean
  bindingProgress: number
  bindingError: string | null

  // 数据状态
  generatedOutline: OutlineSection[]
  currentOutline: any // TODO: 使用Outline类型定义
  sections: any[]
}

export function useOutlinePage() {
  const router = useRouter()
  const route = useRoute()

  // ========== Store 实例 ==========
  const outlineStore = useOutlineStore()
  const sectionStore = useOutlineSectionStore()
  const materialRelationStore = useMaterialRelationStore()
  const documentStore = useDocumentGenerateStore()
  const projectStore = useProjectStore()
  const { documentState, loading } = storeToRefs(documentStore)

  const projectId = route.params.projectId as string

  // ========== 本地状态 ==========
  const state = reactive<OutlineState>({
    isGenerating: false,
    progress: 0,
    error: null,
    isEditing: false,
    isBindingMaterials: false,
    bindingProgress: 0,
    bindingError: null,
    generatedOutline: [],
    currentOutline: null,
    sections: []
  })

  // 状态
  const loadingProject = ref(false)
  const selectedMaterials = ref<Material[]>([])
  const showMaterialLibraryDialog = ref(false)

  // ========== 计算属性 ==========
  const hasGeneratedOutline = computed(() => state.generatedOutline.length > 0)
  const sectionCount = computed(() => state.sections.length)
  const totalWordEstimate = computed(() =>
    state.generatedOutline.reduce(
      (total, section) => total + (section.estimated_word_count || 0),
      0
    )
  )
  const isActive = computed(() => outlineStore.isActive)
  const canGenerateOutline = computed(() => !loading.value)

  const selectedTitle = computed(() => {
    return documentStore.documentState.selectedTitle?.title || ''
  })

  const titleDescription = computed(() => {
    return documentStore.documentState.selectedTitle?.angle || ''
  })

  const canAddSection = computed(() => {
    // 支持真实大纲和本地生成的大纲
    return state.sections.length + state.generatedOutline.length < 10
  })

  const canGenerateFromTitle = computed(() => {
    return documentStore.documentState.selectedTitle && documentStore.documentState.researchBrief
  })

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

  // ========== 状态同步 ==========
  watch(
    () => documentState.value.generatedOutline,
    (newOutline) => {
      documentStore.cleanupExpiredTasks()
      state.isGenerating = loading.value && documentState.value.outlineTask?.status === 'running'
      state.progress = documentState.value.outlineTask?.progress || 0
      state.error = documentState.value.outlineTask?.error || null
      state.generatedOutline = newOutline || []
    },
    { immediate: true }
  )

  watch(
    () => outlineStore.currentOutline,
    (outline) => {
      state.currentOutline = outline
    },
    { immediate: true }
  )

  watch(
    () => sectionStore.sections,
    (sections) => {
      state.sections = sections
    },
    { immediate: true }
  )

  // ========== 初始化 ==========
  onMounted(async () => {
    // 更新当前步骤
    documentStore.documentState.currentStep = 'outline'

    // 清理过期的任务
    documentStore.cleanupExpiredTasks()

    // 加载项目信息
    await loadProject()

    // ========== 新增：项目级状态管理 ==========
    // 如果有项目ID，尝试恢复项目状态
    if (projectId) {
      console.log(`[DEBUG] 大纲页面：检查项目 ${projectId} 的状态`)

      // 检查是否需要设置当前项目
      if (!documentStore.currentProjectId) {
        documentStore.setCurrentProject(projectId)
      }

      // 尝试加载已保存的状态
      const hasSavedState = documentStore.loadFromProjectStorage(projectId)
      if (hasSavedState) {
        console.log('[DEBUG] 大纲页面：已恢复项目状态')
      } else {
        console.log('[DEBUG] 大纲页面：无已保存状态')
      }
    }
    // ========== 状态管理结束 ==========

    // 加载现有数据
    await loadExistingData()
  })

  // ========== 数据层方法 (真实API调用) ==========
  /**
   * 加载项目的大纲
   */
  const loadOutline = async (projectId: number) => {
    try {
      const outline = await outlineStore.fetchActiveOutline(projectId)
      if (outline) {
        await sectionStore.fetchSectionsByOutline(outline.id)
        return outline
      }
      return null
    } catch (err) {
      console.error('Load outline error:', err)
      return null
    }
  }

  /**
   * 创建新大纲
   */
  const createOutline = async (
    projectId: number,
    titleCandidateId: number,
    researchBrief?: string
  ) => {
    try {
      const outline = await outlineStore.createOutline(projectId, {
        title_candidate_id: titleCandidateId,
        research_brief: researchBrief
      })
      return outline
    } catch (err) {
      console.error('Create outline error:', err)
      throw err
    }
  }

  /**
   * 添加章节 (真实API)
   */
  const addSection = async (title: string, contentDirection?: string) => {
    if (!state.currentOutline) {
      ElMessage.warning('请先创建大纲')
      return null
    }

    const newSection: OutlineSectionCreate = {
      title,
      content_direction: contentDirection,
      order_index: state.sections.length + 1
    }

    try {
      const section = await sectionStore.createSection(state.currentOutline.id, newSection)
      return section
    } catch (err) {
      console.error('Add section error:', err)
      throw err
    }
  }

  /**
   * 更新章节 (真实API)
   */
  const updateSection = async (
    sectionId: number,
    updates: { title?: string; content_direction?: string }
  ) => {
    try {
      await sectionStore.updateSection(sectionId, updates)
    } catch (err) {
      console.error('Update section error:', err)
      throw err
    }
  }

  /**
   * 删除章节 (真实API)
   */
  const deleteSection = async (sectionId: number) => {
    try {
      await sectionStore.deleteSection(sectionId)
      ElMessage.success('章节删除成功')
    } catch (err) {
      console.error('Delete section error:', err)
      ElMessage.error('删除章节失败')
      throw err
    }
  }

  /**
   * 移动章节顺序
   */
  const moveSection = (sectionId: number, direction: 'up' | 'down') => {
    sectionStore.moveSection(sectionId, direction)
  }

  /**
   * 批量创建章节
   */
  const batchCreateSections = async (sectionsData: OutlineSectionCreate[]) => {
    if (!state.currentOutline) {
      ElMessage.warning('请先创建大纲')
      return null
    }

    try {
      const result = await sectionStore.batchCreateSections(state.currentOutline.id, sectionsData)
      return result
    } catch (err) {
      console.error('Batch create sections error:', err)
      throw err
    }
  }

  /**
   * 重新排序章节
   */
  const reorderSections = async () => {
    const sectionOrders = state.sections.map((section, index) => ({
      id: section.id,
      order_index: index + 1
    }))

    try {
      await sectionStore.reorderSections(sectionOrders)
      ElMessage.success('章节排序更新成功')
    } catch (err) {
      console.error('Reorder sections error:', err)
      ElMessage.error('重新排序失败')
      throw err
    }
  }

  // ========== 素材绑定方法 ==========
  /**
   * 绑定素材到章节 (真实API)
   */
  const bindMaterialToSection = async (
    sectionId: number,
    materialId: number,
    bindingType: 'primary' | 'reference' | 'supporting' = 'reference'
  ) => {
    try {
      await materialRelationStore.bindMaterialToSection(sectionId, materialId, bindingType)
      ElMessage.success('素材绑定成功')
    } catch (err) {
      console.error('Bind material error:', err)
      ElMessage.error('绑定素材失败')
      throw err
    }
  }

  /**
   * 解绑素材 (真实API)
   */
  const unbindMaterialFromSection = async (sectionId: number, materialId: number) => {
    try {
      await materialRelationStore.unbindMaterialFromSection(sectionId, materialId)
    } catch (err) {
      console.error('Unbind material error:', err)
      ElMessage.error('解绑素材失败')
      throw err
    }
  }

  /**
   * 获取章节的素材
   */
  const loadSectionMaterials = async (sectionId: number) => {
    try {
      await materialRelationStore.fetchSectionMaterials(sectionId)
      return materialRelationStore.getSectionRelationsBySectionId(sectionId)
    } catch (err) {
      console.error('Load section materials error:', err)
      return []
    }
  }

  /**
   * 激活大纲
   */
  const activateOutline = async (outlineId: number, reason?: string) => {
    try {
      await outlineStore.activateOutline(outlineId, reason)
      ElMessage.success('大纲激活成功')
    } catch (err) {
      console.error('Activate outline error:', err)
      ElMessage.error('激活大纲失败')
      throw err
    }
  }

  /**
   * 停用大纲
   */
  const deactivateOutline = async (outlineId: number, reason?: string) => {
    try {
      await outlineStore.deactivateOutline(outlineId, reason)
      ElMessage.success('大纲停用成功')
    } catch (err) {
      console.error('Deactivate outline error:', err)
      ElMessage.error('停用大纲失败')
      throw err
    }
  }

  // ========== UI层方法 (本地操作) ==========
  /**
   * 添加章节 (本地 - 用于AI生成的大纲)
   */
  const addLocalSection = () => {
    const newSection: OutlineSection = {
      title: '新章节',
      content_direction: '',
      data_requirements: [],
      level: 1,
      estimated_word_count: 500,
      priority: 'medium',
      sources: []
    }
    state.generatedOutline.push(newSection)
  }

  /**
   * 编辑章节 (本地)
   */
  const editLocalSection = (sectionTitle: string, updates: Partial<OutlineSection>) => {
    const section = state.generatedOutline.find((s) => s.title === sectionTitle)
    if (section) {
      Object.assign(section, updates)
    }
  }

  /**
   * 重置大纲 (本地)
   */
  const resetLocalOutline = () => {
    state.generatedOutline = []
  }

  /**
   * 验证大纲
   */
  const validateOutline = (): boolean => {
    if (state.generatedOutline.length === 0 && state.sections.length === 0) {
      return false
    }

    // 检查本地大纲
    if (state.generatedOutline.length > 0) {
      const hasEmptyTitle = state.generatedOutline.some((section) => !section.title.trim())
      if (hasEmptyTitle) {
        return false
      }
    }

    return true
  }

  /**
   * 导出大纲
   */
  const exportOutline = (format: 'json' | 'markdown') => {
    const outlineToExport =
      state.generatedOutline.length > 0 ? state.generatedOutline : state.sections

    if (format === 'json') {
      const dataStr = JSON.stringify(outlineToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'outline.json'
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  // ========== AI层方法 ==========
  /**
   * 生成大纲 (AI)
   */
  const generateOutline = async () => {
    // 这里可以调用真实的AI服务
    return {
      outline: [
        {
          title: '引言',
          content_direction: '介绍主题背景和重要性',
          data_requirements: ['行业数据', '案例分析'],
          level: 1,
          estimated_word_count: 800,
          priority: 'high' as const,
          sources: []
        },
        {
          title: '主要部分',
          content_direction: '详细阐述核心内容',
          data_requirements: ['统计数据', '专家观点'],
          level: 1,
          estimated_word_count: 2000,
          priority: 'medium' as const,
          sources: []
        }
      ]
    }
  }

  /**
   * 基于素材生成大纲
   */
  const generateOutlineFromMaterials = async (materials: Material[]) => {
    const outline = materials.map((material, index) => {
      const contentDirection = `基于素材"${material.title}"进行深入分析：${material.summary}`
      const dataRequirements =
        material.tags && material.tags.length > 0 ? [...material.tags] : [`素材${index + 1}的内容`]

      return {
        title: material.title,
        content_direction: contentDirection,
        data_requirements: dataRequirements,
        level: 1,
        estimated_word_count: 1000,
        priority: 'medium' as const,
        sources: material.url ? [material.url] : []
      }
    })

    return { outline }
  }

  /**
   * 获取大纲工具状态
   */
  const getOutlineToolsStatus = async () => {
    return {
      configured: true
    }
  }

  /**
   * AI智能绑定素材
   */
  const bindMaterialsWithAI = async (
    materials: Material[],
    title: string,
    researchBrief: string
  ): Promise<{
    success: boolean
    message: string
    statistics: {
      total_sections: number
      total_bindings: number
      average_relevance: number
    }
  }> => {
    if (state.generatedOutline.length === 0 && state.sections.length === 0) {
      throw new Error('请先生成或创建大纲')
    }

    if (materials.length === 0) {
      throw new Error('请先选择素材')
    }

    try {
      state.isBindingMaterials = true
      state.bindingProgress = 0
      state.bindingError = null

      const progressInterval = setInterval(() => {
        if (state.bindingProgress < 90) {
          state.bindingProgress += 10
        }
      }, 200)

      const outline = state.generatedOutline.length > 0 ? state.generatedOutline : state.sections

      const response = await documentGenerateService.bindMaterialsWithAI({
        outline,
        materials,
        title,
        researchBrief
      })

      clearInterval(progressInterval)
      state.bindingProgress = 100

      if (response.success && response.data) {
        const { bindings } = response.data

        bindings.forEach((binding: any) => {
          const sectionIndex = binding.section_index
          if (sectionIndex >= 0 && sectionIndex < outline.length) {
            const section = outline[sectionIndex]
            const boundMaterialTitles = binding.bound_materials.map((m: any) => m.material_title)

            if ('data_requirements' in section) {
              section.data_requirements = Array.from(
                new Set([...(section.data_requirements || []), ...boundMaterialTitles])
              )
            }
          }
        })

        return {
          success: true,
          message: `AI绑定完成！共绑定 ${response.data.statistics.total_bindings} 个素材到 ${response.data.statistics.total_sections} 个章节`,
          statistics: response.data.statistics
        }
      } else {
        throw new Error(response.message || 'AI绑定失败')
      }
    } catch (error) {
      state.bindingError = error instanceof Error ? error.message : 'AI绑定素材时发生未知错误'
      throw error
    } finally {
      state.isBindingMaterials = false
      setTimeout(() => {
        state.bindingProgress = 0
      }, 1000)
    }
  }

  /**
   * 重置所有状态
   */
  const reset = () => {
    outlineStore.reset()
    sectionStore.reset()
    materialRelationStore.reset()
    state.generatedOutline = []
  }

  // ========== 原有方法 ==========
  // 加载项目信息
  const loadProject = async () => {
    try {
      loadingProject.value = true

      if (!projectId) {
        ElMessage.error('项目ID不存在')
        return
      }

      const numericProjectId = Number(projectId)

      // 如果 store 中已有当前项目且ID匹配，直接返回
      if (
        projectStore.currentProject &&
        Number(projectStore.currentProject.id) === numericProjectId
      ) {
        return
      }

      // 如果项目列表为空，先加载项目列表
      if (projectStore.projects.length === 0) {
        try {
          await projectStore.fetchProjects()
        } catch (error) {
          console.error('加载项目列表失败:', error)
        }
      }

      // 从项目列表中查找
      const project = projectStore.projects.find((p) => Number(p.id) === numericProjectId)
      if (project) {
        projectStore.setCurrentProject(project)
        return
      }

      // 如果项目列表中没有，尝试从API获取
      try {
        const { projectService } = await import('@/services/projectService')
        const response = await projectService.getProjectDetail(numericProjectId)

        if (response.project) {
          projectStore.setCurrentProject(response.project as any)
        }
      } catch (apiError) {
        console.error('从API获取项目失败:', apiError)
        ElMessage.error('项目不存在或已被删除')
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      ElMessage.error('加载项目信息失败')
    } finally {
      loadingProject.value = false
    }
  }

  const loadExistingData = async () => {
    // 从localStorage加载标题数据
    const titlesData = localStorage.getItem(`project_${projectId}_titles`)
    if (titlesData) {
      const { selectedTitle: title } = JSON.parse(titlesData)
      if (title) {
        // 标题数据已存储到store，无需额外处理
      }
    }

    // 检查服务状态
    try {
      await getOutlineToolsStatus()
    } catch {
      ElMessage.warning('大纲生成服务状态检查失败，将使用模拟数据')
    }
  }

  // 素材相关方法
  const toggleMaterialSelection = (id: string) => {
    const index = selectedMaterials.value.findIndex((m) => m.id === id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    } else {
      // 这里需要从素材库中查找，实际项目中需要从 store 或 API 获取
      // 临时使用模拟数据
      const mockMaterial: Material = {
        id,
        user_id: 'user1',
        title: `素材 ${id}`,
        summary: '这是一个模拟素材',
        key_excerpts: [],
        tags: [],
        score: 0.8,
        createdAt: new Date()
      }
      selectedMaterials.value.push(mockMaterial)
    }
  }

  const openMaterialLibrary = () => {
    showMaterialLibraryDialog.value = true
  }

  const handleMaterialLibraryConfirm = (materials: Material[]) => {
    selectedMaterials.value = materials
    ElMessage.success(`已选择 ${selectedMaterials.value.length} 个素材`)
  }

  // 标题相关方法
  const editTitle = () => {
    ElMessage.info('编辑标题功能开发中...')
  }

  const viewSearchResults = () => {
    ElMessage.info('查看搜索结果功能开发中...')
  }

  const goBack = () => {
    router.push(`/document-generation/topic-selection/${projectId}`)
  }

  // ========== 返回值 ==========
  return {
    // 状态
    projectId,
    loadingProject,
    generatingOutline: computed(() => state.isGenerating),
    selectedMaterials,
    showMaterialLibraryDialog,
    loading: computed(() => outlineStore.loading || sectionStore.loading || loading.value),
    error: computed(() => outlineStore.error || sectionStore.error || state.error),

    // 计算属性
    selectedTitle,
    titleDescription,
    canAddSection,
    canGenerateFromTitle,
    hasGeneratedOutline,
    sectionCount,
    totalWordEstimate,
    isActive,
    canGenerateOutline,
    outlineStructure,

    // 数据层方法
    loadOutline,
    createOutline,
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    batchCreateSections,
    reorderSections,
    bindMaterialToSection,
    unbindMaterialFromSection,
    loadSectionMaterials,
    activateOutline,
    deactivateOutline,

    // UI层方法
    addLocalSection,
    editLocalSection,
    resetLocalOutline,
    validateOutline,
    exportOutline,

    // AI层方法
    generateOutline,
    generateOutlineFromMaterials,
    getOutlineToolsStatus,
    bindMaterialsWithAI,

    // 原有页面方法
    loadProject,
    loadExistingData,
    toggleMaterialSelection,
    openMaterialLibrary,
    handleMaterialLibraryConfirm,
    editTitle,
    viewSearchResults,
    goBack,

    // 通用方法
    reset,

    // 大纲管理方法
    outline: {
      // 保持向后兼容，返回 outline 对象
      state,
      loading: computed(() => outlineStore.loading || sectionStore.loading || loading.value),
      error: computed(() => outlineStore.error || sectionStore.error || state.error),

      // 计算属性
      hasGeneratedOutline,
      sectionCount,
      totalWordEstimate,
      isActive,
      canGenerateOutline,
      outlineStructure,

      // 数据层方法
      loadOutline,
      createOutline,
      addSection,
      updateSection,
      deleteSection,
      moveSection,
      batchCreateSections,
      reorderSections,
      bindMaterialToSection,
      unbindMaterialFromSection,
      loadSectionMaterials,
      activateOutline,
      deactivateOutline,

      // UI层方法
      addLocalSection,
      editLocalSection,
      resetLocalOutline,
      validateOutline,
      exportOutline,

      // AI层方法
      generateOutline,
      generateOutlineFromMaterials,
      getOutlineToolsStatus,
      bindMaterialsWithAI,

      // 通用方法
      reset
    }
  }
}
