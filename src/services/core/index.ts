/**
 * Core 服务模块导出文件
 * 集中管理所有 Core API 服务
 * 使用新的BaseApiService架构，支持Mock/真实API切换
 */

import { authService } from './authService'
import { projectService } from './projectService'
import { materialApiService } from './materialService'
import { bodyService } from './bodyService'
import { outlineService } from './outlineService'
import { outlineSectionService } from './outlineSectionService'
import { materialRelationService } from './materialRelationService'
import { requirementService } from './requirementService'
import { researchBriefService } from './researchBriefService'

// 导出类型定义，确保类型一致性
export type {
  AuthServiceType,
  ProjectServiceType,
  MaterialServiceType,
  BodyServiceType,
  OutlineServiceType,
  OutlineSectionServiceType,
  MaterialRelationServiceType,
  RequirementServiceType,
  ResearchBriefServiceType,
  CoreServiceTypes
} from '@/types/core'

// 导出所有服务实例
export {
  authService,
  projectService,
  materialApiService,
  bodyService,
  outlineService,
  outlineSectionService,
  materialRelationService,
  requirementService,
  researchBriefService
}

// 创建 API_MODULES 配置（兼容原有架构）
export const API_MODULES = {
  auth: authService,
  project: projectService,
  material: materialApiService,
  bodies: bodyService,
  outlines: outlineService,
  outlineSections: outlineSectionService,
  materialRelations: materialRelationService,
  requirements: requirementService,
  researchBriefs: researchBriefService
} as const

export type ApiModuleName = keyof typeof API_MODULES
