/**
 * 文档相关组合式函数
 * Document-related Composables
 *
 * 该目录包含所有与文档生成相关的组合式函数：
 * - 大纲生成
 * - 内容管理
 * - 主题选择
 * - 主题庆典
 */

// 统一的大纲页面管理组合式函数
export { useOutlinePage } from './useOutlinePage'

// 标题区域相关组合式函数
export { useTitleSection } from './useTitleSection'
export { useTitleMaterials } from './useTitleMaterials'

// 大纲编辑器相关组合式函数
export { useOutlineEditor } from './useOutlineEditor'

export { useContent } from './useContent'
export { useTopicSelection } from './useTopicSelection'
export { useCeremony } from '../useCeremony'
