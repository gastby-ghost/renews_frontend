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
import { webpageSummaryService } from './webpage-summary'
import { retrievalService } from './retrieval'
import { tasksService } from './tasks'
import { searchAgentService } from './search-agent'
import { searchToolsService } from './search-tools'
import { documentGenerateService } from './document-generate'
import { healthService } from './health'

export const API_MODULES = {
  auth: authService,
  project: projectService,
  material: materialService,
  autosave: autosaveService,
  system: systemService,
  ai: aiService,
  webpageSummary: webpageSummaryService,
  retrieval: retrievalService,
  tasks: tasksService,
  searchAgent: searchAgentService,
  searchTools: searchToolsService,
  documentGenerate: documentGenerateService,
  health: healthService
} as const

export type ApiModuleName = keyof typeof API_MODULES

export {
  authService,
  projectService,
  materialService,
  autosaveService,
  systemService,
  aiService,
  webpageSummaryService,
  retrievalService,
  tasksService,
  searchAgentService,
  searchToolsService,
  documentGenerateService,
  healthService
}
