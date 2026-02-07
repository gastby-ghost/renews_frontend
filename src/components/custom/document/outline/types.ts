import type { Material } from '@/types/core/material'

/** 包含绑定相关属性的素材类型 */
export interface MaterialWithBinding extends Material {
  relevance_explanation?: string
  match_score?: number
  binding_type?: string
}

/** 素材绑定结果类型 */
export interface MaterialBindResult {
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
