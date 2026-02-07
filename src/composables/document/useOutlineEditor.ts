/**
 * 大纲编辑器组合式函数
 * 处理大纲编辑、素材绑定等UI逻辑
 */
import { ref, computed } from 'vue'
import type { Material } from '@/types/core/material'
import type { OutlineSection as CoreOutlineSection } from '@/types/core/outlineSection'

/**
 * 扩展的大纲章节类型，包含UI所需属性
 */
interface OutlineSection extends CoreOutlineSection {
  data_requirements?: string[]
  sources?: string[]
  priority?: 'high' | 'medium' | 'low'
  estimated_word_count?: number
}

/**
 * 素材绑定结果类型（组件内部使用）
 */
interface MaterialWithBinding {
  id: string
  relevance_explanation?: string
  match_score?: number
  binding_type?: string
  title: string
  summary?: string
  url?: string
  score?: number
  key_excerpts?: string[]
  tags?: string[]
}

interface MaterialBindResult {
  title: string
  material_section_bindings: Array<{
    section_id: number
    section_title: string
    materials: MaterialWithBinding[]
    match_scores: number[]
    relevance_explanation: string
    binding_type?: string
    binding_reason?: string
    material_usage_justification?: string
    section_level?: number
  }>
  binding_summary?: string
  final_report?: string
  total_sections: number
  total_materials_bound: number
}

export interface UseOutlineEditorOptions {
  /** 生成的大纲章节列表 */
  generatedOutline: OutlineSection[]
  /** 已选择的素材列表 */
  selectedMaterials: Material[]
  /** 素材绑定结果 */
  bindingResult: MaterialBindResult | null
}

export function useOutlineEditor(options: UseOutlineEditorOptions) {
  // Props
  const generatedOutline = computed(() => options.generatedOutline)
  const selectedMaterials = computed(() => options.selectedMaterials || [])
  const bindingResult = computed(() => options.bindingResult)

  // ====== 本地 UI 状态 ======
  /** 当前激活的详情标签页 */
  const activeDetailTab = ref('')

  // ====== 计算属性 ======

  /** 获取所有素材 */
  const getAllMaterials = computed(() => selectedMaterials.value)

  // ====== 业务逻辑方法 ======

  /**
   * 获取章节的绑定素材
   */
  const getSectionBindings = (sectionIndex: number) => {
    if (!bindingResult.value) return undefined
    return bindingResult.value.material_section_bindings.find(
      (binding) => binding.section_id === sectionIndex + 1
    )
  }

  /**
   * 获取章节的平均匹配分数
   */
  const getAverageMatchScore = (sectionIndex: number): number => {
    const bindings = getSectionBindings(sectionIndex)
    if (!bindings || bindings.match_scores.length === 0) return 0
    const average =
      bindings.match_scores.reduce((sum, score) => sum + score, 0) / bindings.match_scores.length
    return Math.round(average)
  }

  /**
   * 获取可用于当前章节的素材（排除已绑定的）
   */
  const getAvailableMaterialsForSection = (sectionIndex: number): Material[] => {
    const section = generatedOutline.value[sectionIndex]
    if (!section) return []

    // 获取已绑定的素材标题
    const boundMaterials = new Set(section.data_requirements || [])

    // 如果有AI绑定结果，也排除那些
    const aiBindings = getSectionBindings(sectionIndex)
    if (aiBindings) {
      aiBindings.materials.forEach((material) => {
        boundMaterials.add(material.title)
      })
    }

    // 返回所有素材中未绑定的部分
    return getAllMaterials.value.filter((material) => !boundMaterials.has(material.title))
  }

  return {
    // UI 状态
    activeDetailTab,

    // 计算属性
    getAllMaterials,

    // 业务逻辑方法
    getSectionBindings,
    getAverageMatchScore,
    getAvailableMaterialsForSection
  }
}
