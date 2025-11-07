/**
 * 组合式函数统一导出
 * Composables Unified Exports
 *
 * 该文件集中导出所有组合式函数，按功能域分组
 */

// 通用工具
export { useAuth } from './useAuth'
export { useTheme } from './useTheme'
export { useCommon } from './useCommon'
export { useHeaderBar } from './useHeaderBar'
export { useFastEnter } from './useFastEnter'

// 表格相关
export { useTable } from './useTable'
export { useTableColumns } from './useTableColumns'

// 图表相关
export { useChart } from './useChart'

// ========== 按业务域组织 ==========

// 素材模块
export * as MaterialComposables from './material'

// 项目模块
export * as ProjectComposables from './project'

// 文档模块
export * as DocumentComposables from './document'
