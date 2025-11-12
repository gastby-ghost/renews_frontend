import { ref, onMounted, computed, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useOutlineStore } from '@/store/modules/outline'
import { useOutlineSectionStore } from '@/store/modules/outlineSection'
import { useMaterialRelationStore } from '@/store/modules/materialRelation'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useProjectStore } from '@/store/modules/project'
import { useMaterialBindStore } from '@/store/modules/materialBind'
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
  const materialBindStore = useMaterialBindStore()
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

  // 同步素材绑定store的状态到本地状态
  watch(
    () => materialBindStore.isBinding,
    (isBinding) => {
      state.isBindingMaterials = isBinding
    }
  )

  watch(
    () => materialBindStore.bindingProgress,
    (progress) => {
      state.bindingProgress = progress
    }
  )

  watch(
    () => materialBindStore.error,
    (err) => {
      state.bindingError = err
    }
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
   * AI完整生成：生成大纲并绑定素材
   */
  const generateAICompleteOutline = async () => {
    console.log('========================================')
    console.log('[OUTLINE] generateAICompleteOutline 开始执行')
    console.log('[OUTLINE] selectedTitle:', selectedTitle.value)
    console.log('[OUTLINE] researchBrief:', documentStore.documentState.researchBrief)
    console.log('[OUTLINE] selectedMaterials 数量:', selectedMaterials.value.length)
    console.log('[OUTLINE] projectId:', projectId)
    console.log('========================================')

    if (!selectedTitle.value) {
      ElMessage.warning('请先选择标题')
      return
    }

    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择素材')
      return
    }

    try {
      state.isGenerating = true
      state.progress = 0
      state.error = null

      // 准备请求数据
      const requestData = {
        title: selectedTitle.value,
        materials: selectedMaterials.value.map((m) => ({
          id: m.id,
          title: m.title,
          summary: m.summary || '',
          content: (m as any).content || '',
          score: m.score || 0.8,
          key_excerpts: (m as any).key_excerpts || [],
          published_date: (m as any).published_date || new Date().toISOString(),
          source_url: (m as any).source_url || '',
          source_type: (m as any).source_type || 'article',
          author: (m as any).author || '未知'
        })),
        research_brief: documentStore.documentState.researchBrief || '',
        force_research: false
      }

      console.log('[OUTLINE] 准备调用 API')
      console.log('[OUTLINE] requestData:', requestData)

      // 调用新的API - outline-with-material
      const poller = await documentGenerateService.executeOutlineWithMaterialWithPolling(
        'user123', // TODO: 从用户store获取真实userId
        projectId,
        requestData
      )

      console.log('[OUTLINE] API调用成功，poller:', poller)

      // 监听进度
      poller.on('progress', (result: any) => {
        console.log('[OUTLINE] 收到进度更新:', result)
        if (result.data?.progress) {
          state.progress = result.data.progress
        }
      })

      // 等待任务完成
      console.log('[OUTLINE] 等待任务完成...')
      const finalStatus = await poller.promise
      console.log('[OUTLINE] 任务完成:', finalStatus)

      if (finalStatus.data?.status === 'completed' && finalStatus.data?.data) {
        const resultData = finalStatus.data.data

        console.log('[OUTLINE] 处理生成结果:', resultData)

        // 更新大纲
        state.generatedOutline = resultData.outline || []

        console.log('[OUTLINE] 大纲已更新，数量:', state.generatedOutline.length)

        // 更新素材绑定信息到章节
        if (resultData.material_bindings && resultData.material_bindings.length > 0) {
          console.log('[OUTLINE] 处理素材绑定信息')
          resultData.material_bindings.forEach((binding: any) => {
            const sectionIndex = binding.section_id - 1
            if (sectionIndex >= 0 && sectionIndex < state.generatedOutline.length) {
              const section = state.generatedOutline[sectionIndex]
              // 将绑定的素材标题添加到data_requirements
              const materialTitles = binding.materials.map((m: any) => m.title)
              section.data_requirements = Array.from(
                new Set([...(section.data_requirements || []), ...materialTitles])
              )
              console.log(`[OUTLINE] 章节 ${sectionIndex} 已绑定素材:`, materialTitles)
            }
          })

          // 将绑定结果保存到materialBindStore，以便UI显示
          const bindingResultForStore = {
            title: resultData.title,
            material_section_bindings: resultData.material_bindings.map((binding: any) => ({
              section_id: binding.section_id,
              section_title: binding.section_title,
              materials: binding.materials.map((m: any) => ({
                id: m.id,
                title: m.title,
                summary: m.summary,
                score: m.score,
                published_date: m.published_date,
                url: m.url,
                relevance_explanation: m.relevance_explanation
              })),
              binding_type: binding.binding_type,
              binding_reason: binding.binding_reason,
              match_scores: binding.match_scores,
              material_usage_justification: binding.material_usage_justification,
              section_level: binding.section_level
            })),
            binding_summary: resultData.generation_summary || '',
            final_report: resultData.final_report,
            total_sections: resultData.total_sections,
            total_materials_bound: resultData.total_materials_bound
          }

          // 更新materialBindStore的bindingResult
          materialBindStore.updateBindingResult(bindingResultForStore)
          console.log('[OUTLINE] 绑定结果已保存到materialBindStore')
        }

        // 显示成功消息
        const successMessage =
          resultData.final_report ||
          `AI完整生成完成！共生成 ${resultData.total_sections} 个章节，绑定 ${resultData.total_materials_bound} 个素材，预计 ${resultData.total_word_estimate} 字`
        ElMessage.success(successMessage)
        console.log('[OUTLINE] generateAICompleteOutline 执行完成')
      } else {
        throw new Error(finalStatus.data?.error || 'AI完整生成失败')
      }
    } catch (error) {
      console.error('[OUTLINE] 捕获到异常:', error)
      state.error = error instanceof Error ? error.message : 'AI完整生成时发生未知错误'
      ElMessage.error(state.error)
      throw error
    } finally {
      state.isGenerating = false
      state.progress = 0
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
   * AI智能绑定素材（新版异步任务）
   */
  const bindMaterialsWithAI = async (
    materials: Material[],
    title: string,
    researchBrief: string
  ): Promise<{
    success: boolean
    message: string
    taskId?: string
    result?: any
  }> => {
    console.log('========================================')
    console.log('[BIND FUNCTION] bindMaterialsWithAI 开始执行')
    console.log('[BIND FUNCTION] 参数 materials 数量:', materials.length)
    console.log('[BIND FUNCTION] 参数 title:', title)
    console.log('[BIND FUNCTION] 参数 researchBrief:', researchBrief)
    console.log('[BIND FUNCTION] state.generatedOutline 长度:', state.generatedOutline.length)
    console.log('[BIND FUNCTION] state.sections 长度:', state.sections.length)

    if (state.generatedOutline.length === 0 && state.sections.length === 0) {
      console.error('[BIND FUNCTION] 错误：未生成大纲')
      throw new Error('请先生成或创建大纲')
    }

    if (materials.length === 0) {
      console.error('[BIND FUNCTION] 错误：未选择素材')
      throw new Error('请先选择素材')
    }

    try {
      console.log('[BIND FUNCTION] 设置状态 isBindingMaterials = true')
      state.isBindingMaterials = true
      state.bindingError = null

      // 准备请求数据
      console.log('[BIND FUNCTION] 准备 outlineSections')
      const outlineSections =
        state.generatedOutline.length > 0
          ? state.generatedOutline.map((section, index) => {
              console.log(`[BIND FUNCTION] 处理大纲章节 ${index}:`, section.title)
              return {
                id: index + 1,
                outline_id: 1,
                section_title: section.title,
                content_direction: section.content_direction || '',
                data_requirements: section.data_requirements || [],
                sources: section.sources || [],
                section_order: index + 1,
                estimated_words: section.estimated_word_count || 500
              }
            })
          : state.sections.map((section, index) => {
              console.log(`[BIND FUNCTION] 处理数据库章节 ${index}:`, section.title)
              return {
                id: section.id || index + 1,
                outline_id: section.outline_id || 1,
                section_title: section.title,
                content_direction: section.content_direction || '',
                data_requirements: section.data_requirements || [],
                sources: section.sources || [],
                section_order: section.order_index || index + 1,
                estimated_words: section.estimated_word_count || 500
              }
            })

      console.log('[BIND FUNCTION] outlineSections 准备完成:', outlineSections)

      // 准备 materials 数据
      console.log('[BIND FUNCTION] 准备 materials')
      const preparedMaterials = materials.map((material, index) => {
        console.log(`[BIND FUNCTION] 处理素材 ${index}:`, material.title)
        return {
          id: Number(material.id),
          title: material.title,
          summary: material.summary || '',
          content: (material as any).content || '',
          score: material.score || 0.8,
          key_excerpts: material.key_excerpts || [],
          published_date: (material as any).published_date || new Date().toISOString(),
          source_url: (material as any).source_url || '',
          source_type: (material as any).source_type || 'article',
          author: (material as any).author || '未知'
        }
      })

      console.log('[BIND FUNCTION] materials 准备完成:', preparedMaterials)

      // 使用新的素材绑定store
      console.log('[BIND FUNCTION] 调用 materialBindStore.executeMaterialBind')
      console.log('[BIND FUNCTION] userId:', 'user123')
      console.log('[BIND FUNCTION] projectId:', projectId)
      console.log('[BIND FUNCTION] request.title:', title)
      console.log('[BIND FUNCTION] request.outline_sections 数量:', outlineSections.length)
      console.log('[BIND FUNCTION] request.materials 数量:', preparedMaterials.length)

      const poller = await materialBindStore.executeMaterialBind(
        'user123', // TODO: 从用户store获取真实userId
        projectId,
        {
          user_id: 'user123',
          project_id: projectId,
          title,
          outline_sections: outlineSections,
          materials: preparedMaterials
        }
      )

      console.log('[BIND FUNCTION] materialBindStore.executeMaterialBind 返回:', poller)
      console.log('[BIND FUNCTION] poller.id:', poller.id)
      console.log('[BIND FUNCTION] poller.isPolling:', poller.isPolling)

      // 同步进度到本地状态
      console.log('[BIND FUNCTION] 设置 poller.on(progress) 监听器')
      poller.on('progress', (result: any) => {
        console.log('[BIND FUNCTION] 收到 progress 事件:', result)
        if (result.data?.progress) {
          state.bindingProgress = result.data.progress
        }
      })

      // 等待任务完成
      console.log('[BIND FUNCTION] 等待 poller.promise 完成...')
      const finalStatus = await poller.promise
      console.log('[BIND FUNCTION] poller.promise 已完成:', finalStatus)

      if (finalStatus.data?.status === 'completed' && finalStatus.data?.result) {
        console.log('[BIND FUNCTION] 任务完成，处理结果')
        // 更新大纲章节的data_requirements
        const bindings = finalStatus.data.result.material_section_bindings

        console.log('[BIND FUNCTION] 绑定结果数量:', bindings.length)

        bindings.forEach((binding: any, index: number) => {
          console.log(`[BIND FUNCTION] 处理绑定结果 ${index}:`, binding)
          const sectionIndex = binding.section_id - 1
          const outline =
            state.generatedOutline.length > 0 ? state.generatedOutline : state.sections

          console.log(
            `[BIND FUNCTION] sectionIndex: ${sectionIndex}, outline长度: ${outline.length}`
          )

          if (sectionIndex >= 0 && sectionIndex < outline.length) {
            const section = outline[sectionIndex]
            const boundMaterialTitles = binding.materials.map((m: any) => m.title)

            console.log(`[BIND FUNCTION] 章节: ${section.title}`)
            console.log(`[BIND FUNCTION] 绑定的素材标题:`, boundMaterialTitles)

            if ('data_requirements' in section) {
              section.data_requirements = Array.from(
                new Set([...(section.data_requirements || []), ...boundMaterialTitles])
              )
              console.log(`[BIND FUNCTION] 更新后的 data_requirements:`, section.data_requirements)
            }
          }
        })

        console.log('[BIND FUNCTION] 所有绑定处理完成')

        return {
          success: true,
          message: `AI绑定完成！共绑定 ${finalStatus.data.result.total_materials_bound} 个素材到 ${finalStatus.data.result.total_sections} 个章节`,
          taskId: finalStatus.data.task_id,
          result: finalStatus.data.result
        }
      } else {
        console.error('[BIND FUNCTION] 任务失败或没有结果:', finalStatus)
        throw new Error(finalStatus.data?.error || 'AI绑定失败')
      }
    } catch (error) {
      console.error('[BIND FUNCTION] 捕获到异常:', error)
      state.bindingError = error instanceof Error ? error.message : 'AI绑定素材时发生未知错误'
      throw error
    } finally {
      console.log('[BIND FUNCTION] finally 块执行')
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

  // ========== 素材绑定事件处理 ==========
  const handleAIBindMaterials = async () => {
    console.log('========================================')
    console.log('[COMPOSABLE] handleAIBindMaterials 开始执行')
    console.log('[COMPOSABLE] selectedMaterials:', selectedMaterials.value)
    console.log('[COMPOSABLE] projectId:', projectId)
    console.log('[COMPOSABLE] generatedOutline 长度:', state.generatedOutline.length)
    console.log('[COMPOSABLE] sections 长度:', state.sections.length)
    console.log('[COMPOSABLE] selectedTitle:', selectedTitle.value)
    console.log('========================================')

    if (selectedMaterials.value.length === 0) {
      console.warn('[COMPOSABLE] 错误：未选择素材')
      ElMessage.warning('请先选择素材')
      return
    }

    if (state.generatedOutline.length === 0 && state.sections.length === 0) {
      console.warn('[COMPOSABLE] 错误：未生成大纲')
      ElMessage.warning('请先生成或创建大纲')
      return
    }

    try {
      const title = selectedTitle.value || '未命名文档'
      const researchBrief = documentStore.documentState.researchBrief || ''

      console.log('[COMPOSABLE] 准备调用 bindMaterialsWithAI')
      console.log('[COMPOSABLE] 参数 title:', title)
      console.log('[COMPOSABLE] 参数 researchBrief:', researchBrief)

      const result = await bindMaterialsWithAI(selectedMaterials.value, title, researchBrief)

      console.log('[COMPOSABLE] bindMaterialsWithAI 返回结果:', result)

      if (result.success) {
        console.log('[COMPOSABLE] 素材绑定成功')
        ElMessage.success(result.message)
      } else {
        console.warn('[COMPOSABLE] 素材绑定失败:', result)
      }
    } catch (error) {
      console.error('[COMPOSABLE] 捕获到异常:', error)
      ElMessage.error(error instanceof Error ? error.message : '素材绑定失败')
    }

    console.log('[COMPOSABLE] handleAIBindMaterials 执行完成')
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
    generateAICompleteOutline,
    getOutlineToolsStatus,
    bindMaterialsWithAI,

    // 原有页面方法
    loadProject,
    loadExistingData,
    toggleMaterialSelection,
    openMaterialLibrary,
    handleMaterialLibraryConfirm,
    handleAIBindMaterials,
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
      generateAICompleteOutline,
      getOutlineToolsStatus,
      bindMaterialsWithAI,

      // 通用方法
      reset
    }
  }
}
