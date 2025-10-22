/**
 * 服务统一导出文件
 * 集中管理所有API服务
 * 基于OpenAPI配置的API服务
 */

// 基础服务
export { default as BaseApiService } from './base/apiService'

// 用户认证服务 - 基于OpenAPI配置
export * from './authService'

// 素材管理服务 - 基于OpenAPI配置
export * from './materialService'

// AI智能服务 - 基于OpenAPI配置
export * from './aiService'
