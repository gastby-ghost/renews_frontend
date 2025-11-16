/**
 * API模块导出文件
 * 集中管理所有API模块配置
 */

import { authService } from './auth'
import { projectService } from './project'
import { materialService } from './material'
import { autosaveService } from '../autosave'
import { systemService } from '../system'
import { retrievalService } from '../retrieval'
import { tasksService } from '../tasks'
import { healthService } from '../health'

// 新增的 Core OpenAPI 转换模块
import { bodyService } from './bodies'
import { materialRelationService } from './material-relations'
import { outlineSectionService } from './outline-sections'
import { outlineService } from './outlines'
import { requirementService } from './requirements'
import { researchBriefService } from './research_briefs'
import { titleService } from './titles'

export const API_MODULES = {
  auth: authService,
  project: projectService,
  material: materialService,
  autosave: autosaveService,
  system: systemService,
  retrieval: retrievalService,
  tasks: tasksService,
  health: healthService,
  // 新增的 Core OpenAPI 模块
  bodies: bodyService,
  materialRelations: materialRelationService,
  outlineSections: outlineSectionService,
  outlines: outlineService,
  requirements: requirementService,
  researchBriefs: researchBriefService,
  titles: titleService
} as const

export type ApiModuleName = keyof typeof API_MODULES

export {
  authService,
  projectService,
  materialService,
  autosaveService,
  systemService,
  retrievalService,
  tasksService,
  healthService,
  // 新增的 Core OpenAPI 模块
  bodyService,
  materialRelationService,
  outlineSectionService,
  outlineService,
  requirementService,
  researchBriefService,
  titleService
}
