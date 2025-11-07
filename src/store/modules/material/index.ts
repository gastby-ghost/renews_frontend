/**
 * 素材管理Store
 * Material Management Store
 *
 * 该Store负责管理应用中的所有素材相关状态和操作，包括：
 * - 素材的增删改查
 * - 素材搜索功能（普通搜索和Agent智能搜索）
 * - 素材库管理
 * - 搜索历史记录
 * - Agent任务管理
 *
 * 注意：此Store专注于核心业务逻辑和状态管理，UI相关状态由 useMaterialSearch composable 处理
 */

export { useMaterialStore } from '../../material'
