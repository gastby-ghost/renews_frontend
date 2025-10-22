/**
 * API模块导出文件
 * 集中管理所有API模块配置
 */

import { authService } from './auth'
import { projectService } from './project'
import { materialService } from './material'
import { autosaveService } from './autosave'
import { systemService } from './system'
import { aiService } from './ai'

export const API_MODULES = {
  auth: authService,
  project: projectService,
  material: materialService,
  autosave: autosaveService,
  system: systemService,
  ai: aiService
} as const

export type ApiModuleName = keyof typeof API_MODULES

export { authService, projectService, materialService, autosaveService, systemService, aiService }
