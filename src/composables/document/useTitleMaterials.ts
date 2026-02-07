/**
 * 标题素材组合式函数
 * 处理素材显示、预览、添加等逻辑
 */
import { ref, computed } from 'vue'
import type { Material } from '@/types/core/material'

export interface UseTitleMaterialsOptions {
  allMaterials: Material[]
  emit: (event: string, ...args: any[]) => void
}

export function useTitleMaterials(options: UseTitleMaterialsOptions) {
  const { allMaterials, emit } = options

  // Props
  const allMaterialsRef = computed(() => allMaterials)

  // ====== UI 状态 ======
  const materialsCollapsed = ref(false)
  const showAllMaterials = ref(false)
  const displayLimit = 6

  // ====== 计算属性 ======

  /** 显示的素材列表 */
  const displayMaterials = computed(() => {
    if (showAllMaterials.value) {
      return allMaterialsRef.value
    }
    return allMaterialsRef.value.slice(0, displayLimit)
  })

  /** 是否显示更多按钮 */
  const showMoreButton = computed(() => allMaterialsRef.value.length > displayLimit)

  /** 素材是否为空 */
  const isEmpty = computed(() => allMaterialsRef.value.length === 0)

  // ====== 方法 ======

  /** 处理素材预览 */
  const handleMaterialPreview = (material: Material) => {
    emit('materialPreview', material)
  }

  /** 处理添加素材 */
  const handleAddMaterial = () => {
    emit('addMaterial')
  }

  /** 切换显示全部素材 */
  const toggleShowAllMaterials = () => {
    showAllMaterials.value = !showAllMaterials.value
  }

  /** 切换素材区域展开/收起 */
  const toggleMaterialsCollapse = () => {
    materialsCollapsed.value = !materialsCollapsed.value
  }

  return {
    // UI 状态
    materialsCollapsed,
    showAllMaterials,
    displayLimit,

    // 计算属性
    displayMaterials,
    showMoreButton,
    isEmpty,

    // 方法
    handleMaterialPreview,
    handleAddMaterial,
    toggleShowAllMaterials,
    toggleMaterialsCollapse
  }
}
