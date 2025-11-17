/**
 * AI服务类型定义统一导出
 * 集中管理所有AI相关的类型定义，确保类型一致性和可维护性
 */

// 大纲与素材生成相关类型
export type {
  OutlineWithMaterialRequest,
  OutlineWithMaterialResponse,
  OutlineGenerationOptions,
  MaterialGenerationOptions,
  IntegrationConfig,
  OutlineWithMaterialTaskStatusResponse
} from './outline-with-material'

// 大纲生成相关类型
export type {
  OutlineGenerationRequest,
  OutlineGenerationResponse,
  OutlineToolsStatusResponse
} from './outline-generate'

// 素材绑定相关类型
export type {
  MaterialBindRequest,
  MaterialBindResponse,
  BindingConfig,
  MaterialFilters,
  MaterialBindStatusResponse
} from './material-bind'

// 正文生成相关类型
export type {
  BodyGenerationRequest,
  BodyGenerationResponse,
  BodyToolsStatusResponse
} from './content-generate'

// 标题生成相关类型
export type {
  TitleGenerationRequest,
  TitleGenerationResponse,
  TitleToolsStatusResponse
} from './title-generate'

// 搜索代理相关类型
export type {
  SearchAgentRequest,
  SearchAgentResponse,
  SearchAgentStatusResponse,
  SearchAgentListResponse
} from './search-agent'

// 搜索到标题代理相关类型
export type {
  Search2titleAgentRequest,
  Search2titleAgentResponse,
  Search2titleAgentStatusResponse
} from './search2title-agent'

// 范围界定代理相关类型
export type { ScopeDefinitionRequest, ScopeDefinitionResponse } from './scope-agent'

// 注释掉search-tools类型，因为该文件已迁移位置
// export type {
//   SearchToolsExecuteRequest,
//   SearchToolsExecuteResponse,
//   SearchToolsTaskStatusResponse,
//   SearchToolsStateResponse,
//   SearchToolsStatusResponse,
//   SearchToolsTaskListResponse
// } from './search-tools'
