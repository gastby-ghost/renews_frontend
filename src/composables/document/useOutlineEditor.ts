import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useMaterialBindStore } from '@/store/modules/materialBind'
import { useDocumentGenerateStore } from '@/store/modules/documentGenerate'
import { useOutlineEditorStore } from '@/store/modules/outlineEditor'
import type { Material } from '@/types/material'
import type { SearchResultItem } from '@/types/ai/search-tool'
// 使用本地定义的 OutlineSection 类型

/**
 * 大纲编辑器 Composable
 * 专门用于 OutlineEditorSection.vue 的 UI 逻辑处理
 * @param externalMaterials - 外部传入的素材列表（可选），如果提供则优先使用
 */
export function useOutlineEditor(externalMaterials?: Material[]) {
  // ========== Store 实例 ==========
  const materialBindStore = useMaterialBindStore()
  const documentStore = useDocumentGenerateStore()
  const outlineEditorStore = useOutlineEditorStore()

  // ========== 计算属性 ==========

  /**
   * 获取生成的大纲章节列表
   */
  const generatedOutline = computed(() => {
    const outline = outlineEditorStore.generatedOutline
    console.log('🔄 [generatedOutline computed] 获取大纲数据:', {
      length: outline?.length || 0,
      firstItem: outline?.[0],
      type: typeof outline,
      isArray: Array.isArray(outline)
    })
    return outline
  })

  /**
   * 是否可以从标题生成大纲
   */
  const canGenerateFromTitle = computed(() => {
    return documentStore.documentState.selectedTitle && documentStore.documentState.researchBrief
  })

  /**
   * 是否可以添加章节
   */
  const canAddSection = computed(() => {
    return generatedOutline.value.length < 10
  })

  /**
   * 是否正在生成大纲
   */
  const generatingOutline = computed(() => {
    return documentStore.loading || outlineEditorStore.generatingOutline
  })

  /**
   * 已选择的素材列表
   */
  const selectedMaterials = computed(() => {
    // 如果提供了外部素材，优先使用外部素材
    if (externalMaterials && externalMaterials.length > 0) {
      console.log('📋 [selectedMaterials] 使用外部传入素材:', externalMaterials.length, '个素材')
      return externalMaterials
    }

    // 从 outlineEditorStore 获取已选择的素材
    console.log('📋 [selectedMaterials] 获取已选择素材:', outlineEditorStore.selectedMaterials)
    return outlineEditorStore.selectedMaterials || []
  })

  /**
   * 是否正在绑定素材
   */
  const isBindingMaterials = computed(() => {
    return materialBindStore.isBinding || outlineEditorStore.isBindingMaterials
  })

  /**
   * 素材绑定进度
   */
  const bindingProgress = computed(() => {
    return materialBindStore.bindingProgress || outlineEditorStore.bindingProgress
  })

  /**
   * 素材绑定结果
   */
  const bindingResult = computed(() => {
    return materialBindStore.bindingResult
  })

  /**
   * 获取所有素材
   */
  const getAllMaterials = computed(() => {
    console.log('📋 [getAllMaterials] 获取所有素材:', selectedMaterials.value)
    return selectedMaterials.value
  })

  /**
   * 当前激活的详情标签页
   */
  const activeDetailTab = outlineEditorStore.activeDetailTab

  /**
   * 设置当前激活的详情标签页
   */
  const setActiveDetailTab = (tab: string) => {
    outlineEditorStore.setActiveDetailTab(tab)
  }

  // ========== 事件处理方法 ==========

  /**
   * 处理生成AI大纲
   */
  const handleGenerateAIOutline = async () => {
    console.log('🎯 [handleGenerateAIOutline] 开始执行')
    console.log('📋 [handleGenerateAIOutline] 检查条件:', {
      canGenerateFromTitle: canGenerateFromTitle.value,
      selectedTitle: documentStore.documentState.selectedTitle,
      researchBrief: documentStore.documentState.researchBrief?.substring(0, 50),
      selectedMaterialsCount: selectedMaterials.value.length
    })

    if (!canGenerateFromTitle.value) {
      ElMessage.warning('请先选择标题并完善研究简报')
      return
    }

    try {
      outlineEditorStore.setGeneratingOutline(true)
      outlineEditorStore.setError(null)

      console.log('📋 [handleGenerateAIOutline] 调用参数:', {
        title: documentStore.documentState.selectedTitle,
        researchBrief: documentStore.documentState.researchBrief?.substring(0, 100) + '...',
        webSearchData: '空数组'
      })

      // 将素材转换为 SearchResultItem 类型
      const searchResults: SearchResultItem[] = selectedMaterials.value.map((material) => ({
        url: material.url || '',
        score: material.score || 0.8,
        query: material.title || '',
        aititle: material.title || '',
        summary: material.summary || '',
        tags: material.tags || [],
        key_excerpts: material.key_excerpts || [],
        published_date: material.createdAt?.toISOString() || null
      }))

      console.log(
        '📋 [handleGenerateAIOutline] 转换后的 searchResults:',
        searchResults.length,
        '个素材'
      )

      // 调用 documentStore 的生成大纲方法
      const result = await documentStore.generateOutline(
        documentStore.documentState.selectedTitle || {
          title: '',
          angle: '',
          why_now: '',
          news_values: [],
          verifiability: '',
          sources: [],
          risk_notes: '',
          feasibility: ''
        },
        documentStore.documentState.researchBrief || '',
        searchResults // 使用转换后的素材数据
      )

      console.log('✅ [handleGenerateAIOutline] 生成结果:', result)
      if (result) {
        ElMessage.success('大纲生成成功')
      } else {
        ElMessage.warning('大纲生成完成，但结果为空')
      }
    } catch (error) {
      outlineEditorStore.setError(error instanceof Error ? error.message : '生成大纲失败')
      ElMessage.error(outlineEditorStore.error || '生成大纲失败')
    } finally {
      outlineEditorStore.setGeneratingOutline(false)
    }
  }

  /**
   * 处理生成AI完整大纲
   */
  const handleGenerateAICompleteOutline = async () => {
    console.log('🎯 [handleGenerateAICompleteOutline] 开始执行')
    if (!canGenerateFromTitle.value) {
      ElMessage.warning('请先选择标题并完善研究简报')
      return
    }

    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择素材')
      return
    }

    try {
      outlineEditorStore.setGeneratingOutline(true)
      outlineEditorStore.setError(null)

      console.log('📋 [handleGenerateAICompleteOutline] 调用参数:', {
        topic: documentStore.documentState.selectedTitle?.title,
        materialsCount: selectedMaterials.value.length
      })

      // 调用 documentStore 的完整生成方法
      const result = await documentStore.generateAICompleteOutline({
        outline_request: {
          topic: documentStore.documentState.selectedTitle?.title || '',
          audience_level: 'intermediate',
          depth: 'comprehensive',
          language: 'zh-CN'
        },
        material_request: {
          search_keywords: [],
          material_types: ['article', 'research', 'case_study'],
          credibility_threshold: 0.7,
          max_materials_per_section: 3,
          language: 'zh-CN'
        },
        integration_config: {
          auto_bind_materials: true,
          binding_strategy: 'semantic',
          min_relevance_score: 0.6,
          max_materials_per_outline_section: 3
        }
      })

      console.log('✅ [handleGenerateAICompleteOutline] 生成结果:', result)
      ElMessage.success('完整大纲生成成功')
    } catch (error) {
      outlineEditorStore.setError(error instanceof Error ? error.message : '完整生成失败')
      ElMessage.error(outlineEditorStore.error || '完整生成失败')
    } finally {
      outlineEditorStore.setGeneratingOutline(false)
    }
  }

  /**
   * 处理AI绑定素材
   */
  const handleAIBindMaterials = async () => {
    console.log('🎯 [handleAIBindMaterials] 开始执行')
    if (selectedMaterials.value.length === 0) {
      ElMessage.warning('请先选择素材')
      return
    }

    if (generatedOutline.value.length === 0) {
      ElMessage.warning('请先生成大纲')
      return
    }

    try {
      outlineEditorStore.setIsBindingMaterials(true)
      outlineEditorStore.setError(null)

      console.log('📋 [handleAIBindMaterials] 调用参数:', {
        outlineId: 'current-outline-id',
        materialsCount: selectedMaterials.value.length,
        sectionsCount: generatedOutline.value.length
      })

      // 调用 documentStore 的素材绑定方法
      const result = await documentStore.bindMaterialsWithAI({
        outline_id: 'current-outline-id', // 实际应该从当前大纲获取
        binding_config: {
          strategy: 'semantic',
          min_relevance_score: 0.6,
          max_materials_per_section: 3,
          preferred_material_types: ['article', 'research', 'case_study'],
          language_preference: 'zh-CN',
          credibility_threshold: 0.7
        },
        material_filters: {
          source_types: ['article', 'research', 'case_study'],
          include_keywords: [],
          exclude_keywords: []
        }
      })

      console.log('✅ [handleAIBindMaterials] 绑定结果:', result)
      ElMessage.success('素材绑定成功')
    } catch (error) {
      outlineEditorStore.setError(error instanceof Error ? error.message : '素材绑定失败')
      ElMessage.error(outlineEditorStore.error || '素材绑定失败')
    } finally {
      outlineEditorStore.setIsBindingMaterials(false)
    }
  }

  /**
   * 处理添加章节
   */
  const handleAddSection = () => {
    if (!canAddSection.value) {
      ElMessage.warning('已达到最大章节数量')
      return
    }

    const newSection = {
      title: '新章节',
      content_direction: '',
      data_requirements: [],
      level: 1,
      estimated_word_count: 500,
      priority: 'medium',
      sources: []
    }

    // 添加到本地大纲
    outlineEditorStore.addSection(newSection)
    ElMessage.success('章节添加成功')
  }

  /**
   * 处理删除章节
   */
  const handleDeleteSection = (index: number) => {
    if (index < 0 || index >= generatedOutline.value.length) {
      return
    }

    // 从本地大纲中删除
    outlineEditorStore.deleteSection(index)
    ElMessage.success('章节删除成功')
  }

  /**
   * 处理上移章节
   */
  const handleMoveSectionUp = (index: number) => {
    if (index <= 0 || index >= generatedOutline.value.length) {
      return
    }

    // 交换位置
    outlineEditorStore.moveSectionUp(index)
  }

  /**
   * 处理下移章节
   */
  const handleMoveSectionDown = (index: number) => {
    if (index < 0 || index >= generatedOutline.value.length - 1) {
      return
    }

    // 交换位置
    outlineEditorStore.moveSectionDown(index)
  }

  /**
   * 处理清空大纲
   */
  const handleClearOutline = () => {
    outlineEditorStore.clearOutline()
    ElMessage.success('大纲已清空')
  }

  /**
   * 处理确认大纲
   */
  const handleConfirmOutline = () => {
    if (generatedOutline.value.length === 0) {
      ElMessage.warning('请先创建大纲')
      return
    }

    // 这里可以添加确认大纲的逻辑，比如保存到后端
    ElMessage.success('大纲确认成功')
  }

  /**
   * 处理编辑章节
   */
  const handleEditSection = (title: string, data: any) => {
    outlineEditorStore.updateSection(title, data)
  }

  /**
   * 处理绑定素材
   */
  const handleBindMaterial = (sectionIndex: number, material: Material) => {
    outlineEditorStore.bindMaterialToSection(sectionIndex, material)
  }

  /**
   * 处理解绑素材
   */
  const handleUnbindMaterial = (sectionIndex: number, materialTitle: string) => {
    outlineEditorStore.unbindMaterialFromSection(sectionIndex, materialTitle)
  }

  // ========== 业务逻辑方法 ==========

  /**
   * 获取章节的绑定素材
   */
  const getSectionBindings = (sectionIndex: number) => {
    return outlineEditorStore.getSectionBindings(sectionIndex)
  }

  /**
   * 获取章节的平均匹配分数
   */
  const getAverageMatchScore = (sectionIndex: number): number => {
    return outlineEditorStore.getAverageMatchScore(sectionIndex)
  }

  /**
   * 获取可用于当前章节的素材（排除已绑定的）
   */
  const getAvailableMaterialsForSection = (sectionIndex: number): Material[] => {
    return outlineEditorStore.getAvailableMaterialsForSection(sectionIndex)
  }

  // ========== 返回值 ==========
  return {
    // 状态
    activeDetailTab,

    // 计算属性
    generatedOutline,
    canGenerateFromTitle,
    canAddSection,
    generatingOutline,
    selectedMaterials,
    isBindingMaterials,
    bindingProgress,
    bindingResult,
    getAllMaterials,

    // 状态设置方法
    setActiveDetailTab,

    // 事件处理方法
    handleGenerateAIOutline,
    handleGenerateAICompleteOutline,
    handleAIBindMaterials,
    handleAddSection,
    handleDeleteSection,
    handleMoveSectionUp,
    handleMoveSectionDown,
    handleClearOutline,
    handleConfirmOutline,
    handleEditSection,
    handleBindMaterial,
    handleUnbindMaterial,

    // 业务逻辑方法
    getSectionBindings,
    getAverageMatchScore,
    getAvailableMaterialsForSection
  }
}
