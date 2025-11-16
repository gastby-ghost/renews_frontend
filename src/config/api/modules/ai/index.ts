/**
 * AI API模块导出文件
 * 集中管理所有AI API模块配置
 */

import { searchAgentService } from './search-agent'
import { contentGenerateService } from './content-generate'
import { outlineGenerateService } from './outline-generate'
import { materialBindService } from './material-bind'
import { outlineWithMaterialService } from './outline-with-material'
import { scopeAgentService } from './scope-agent'
import { searchToolsService } from './search-tools'
import { search2titleAgentService } from './search2title-agent'
import { titleGenerateService } from './title-generate'

export const AI_API_MODULES = {
  searchAgent: searchAgentService,
  contentGenerate: contentGenerateService,
  outlineGenerate: outlineGenerateService,
  materialBind: materialBindService,
  outlineWithMaterial: outlineWithMaterialService,
  scopeAgent: scopeAgentService,
  searchTools: searchToolsService,
  search2titleAgent: search2titleAgentService,
  titleGenerate: titleGenerateService
} as const

export type AiApiModuleName = keyof typeof AI_API_MODULES

export {
  searchAgentService,
  contentGenerateService,
  outlineGenerateService,
  materialBindService,
  outlineWithMaterialService,
  scopeAgentService,
  searchToolsService,
  search2titleAgentService,
  titleGenerateService
}
