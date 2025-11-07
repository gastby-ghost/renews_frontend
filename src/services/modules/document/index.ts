/**
 * 文档生成模块
 * Document Generation Module
 *
 * 该模块提供文档生成相关功能，包括：
 * - Scope Agent：范围研究
 * - Search2Title Agent：搜索转标题
 * - Title Generation：标题生成
 * - Outline Generation：大纲生成
 * - Research Brief：研究简报
 * - Title Management：标题管理
 * - Outline Management：大纲管理
 */

// Agent服务
export { ScopeAgentService } from './scope-agent/scopeAgentService'
export { Search2TitleAgentService } from './search2title-agent/search2titleAgentService'
export { TitleAgentService } from './title-agent/titleAgentService'
export { OutlineAgentService } from './outline-agent/outlineAgentService'

// 核心服务
export { ResearchBriefService } from './research-brief/researchBriefService'
export { TitleService } from './title/titleService'
export { TitleVersionService } from './title-version/titleVersionService'

// 便捷方法
export { DocumentGenerateService } from '../../documentGenerateService'
