/**
 * 服务统一导出文件
 * 集中管理所有API服务
 * 基于OpenAPI配置的API服务
 */

// 基础服务
export { default as BaseApiService } from './base/apiService'

// 用户认证服务 - 基于OpenAPI配置
export * from './authService'

// 认证管理器 - 避免循环依赖
export { authManager, getAuthManager, initAuthModule } from './auth/initAuth'

// 项目管理服务 - 基于OpenAPI配置
export * from './projectService'

// 素材管理服务 - 基于OpenAPI配置
export * from './materialService'

// 素材搜索服务 - 专门服务于素材搜索模块
export * from './searchService'

// 系统偏好设置服务 - 基于OpenAPI配置
export * from './systemPreferencesService'

// ========== 文档生成服务 ==========
// 统一导出文档生成相关服务
export * from './documentGenerateService'
export * from './outlineService'
export * from './outlineSectionService'
export * from './bodyService'
export * from './materialRelationService'

// ========== 模块化服务导出 ==========
// 按业务域组织的新结构
export * as DocumentModule from './modules/document'
export * as MaterialModule from './modules/material'
export * as ProjectModule from './modules/project'
export * as SearchModule from './modules/search'
