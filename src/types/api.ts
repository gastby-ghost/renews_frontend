/**
 * API类型定义模块
 * 基于OpenAPI规范的TypeScript类型定义
 *
 * 注意：具体业务类型已迁移至 src/types/business/ 目录
 * 此文件提供向后兼容的重新导出
 */

export { BaseResponse } from './api'

// 重新导出业务类型以保持向后兼容
export * from './business/auth'
export * from './business/user'
export * from './business/project'
export * from './business/material'
export * from './business/ai'
export * from './business/research-brief'
export * from './business/title'
export * from './business/outline'
export * from './business/validation'
