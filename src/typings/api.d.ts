/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */
declare namespace Api {
  /** 基础类型 */
  namespace Http {
    /** 基础响应 */
    interface BaseResponse<T = any> {
      // 状态码
      code: number
      // 消息
      msg: string
      // 数据
      data: T
    }
  }

  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginatingParams {
      /** 当前页码 */
      current: number
      /** 每页条数 */
      size: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type PaginatingSearchParams = Pick<PaginatingParams, 'current' | 'size'>

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 刷新令牌响应 */
    interface RefreshTokenResponse {
      // 根据API规范，刷新令牌API返回空对象
      // 新的访问令牌应该在HTTP响应头中
      // 添加一个可选属性以满足 ESLint 规则
      success?: boolean
    }

    /** 用户注册请求 */
    interface UserRegisterRequest {
      username: string
      email: string
      password: string
      confirm_password: string
      agree_to_terms: boolean
    }

    /** 用户登录请求 */
    interface UserLoginRequest {
      login: string
      password: string
      remember_me?: boolean
    }

    /** 认证响应 */
    interface AuthResponse {
      success: boolean
      message: string
      token?: string | null
      refresh_token?: string | null
      expires_in?: number | null
      user?: UserResponse | null
      redirect_url?: string | null
    }

    /** 用户响应 */
    interface UserResponse {
      id: number
      username: string
      email: string
      is_active: boolean
      is_verified: boolean
      created_at: string
      updated_at: string
      roles?: string[]
      avatar?: string
    }

    /** 待注册响应 */
    interface PendingRegistrationResponse {
      success: boolean
      message: string
      token: string
      email: string
      username: string
    }

    /** 忘记密码请求 */
    interface ForgotPasswordRequest {
      email: string
      newpassword: string
    }

    /** 忘记密码响应 */
    interface ForgotPasswordResponse {
      success: boolean
      message: string
    }

    /** 验证响应 */
    interface VerificationResponse {
      success: boolean
      message: string
      verification_type?: string | null
      user_id?: number | null
      redirect_url?: string | null
    }

    /** 删除账户请求 */
    interface DeleteAccountRequest {
      password: string
      confirmation: string
    }

    /** 账户设置响应 */
    interface AccountSettingsResponse {
      success: boolean
      data: UserResponse
      third_party_accounts: any[]
    }
  }

  /** 用户偏好类型 */
  namespace Preferences {
    /** 用户偏好设置 */
    interface UserPreference {
      user_id: string
      theme?: 'light' | 'dark' | 'auto'
      font_size?: 'small' | 'medium' | 'large'
      auto_save_frequency?: '1' | '3' | '5' | '10' | '15' | '30'
      language?: string
      timezone?: string
      notifications_enabled?: boolean
      sound_enabled?: boolean
      compact_mode?: boolean
      show_tooltips?: boolean
      auto_complete?: boolean
      spell_check?: boolean
      custom_settings?: Record<string, any>
      created_at?: string
      updated_at?: string
    }

    /** 更新用户偏好请求 */
    interface UpdateUserPreferenceRequest {
      theme?: 'light' | 'dark' | 'auto' | null
      font_size?: 'small' | 'medium' | 'large' | null
      auto_save_interval?: number | null
      shortcut_settings?: Record<string, any> | null
      language?: string | null
      timezone?: string | null
      notifications_enabled?: boolean | null
      sound_enabled?: boolean | null
      compact_mode?: boolean | null
      show_tooltips?: boolean | null
      auto_complete?: boolean | null
      spell_check?: boolean | null
      custom_settings?: Record<string, any> | null
    }

    /** 用户偏好响应 */
    interface UserPreferenceResponse {
      theme?: string
      font_size?: string
      auto_save_interval?: number
      shortcut_settings?: Record<string, any> | null
      user_id: number
      created_at: string
      updated_at?: string | null
    }

    /** 默认偏好响应 */
    interface DefaultPreferencesResponse {
      theme: string
      font_size: string
      auto_save_interval: number
      shortcut_settings: Record<string, any>
    }
  }

  /** 项目管理类型 */
  namespace Project {
    /** 创建项目请求 */
    interface ProjectCreate {
      name: string
      status?: string
      current_component?: string
      folder_id?: number | null
    }

    /** 更新项目请求 */
    interface ProjectUpdate {
      name?: string | null
      status?: string | null
      current_component?: string | null
      folder_id?: number | null
    }

    /** 项目响应 */
    interface ProjectResponse {
      id: number
      name: string
      status: string
      current_component: string
      folder_id?: number | null
      user_id: number
      last_modified: string
      created_at: string
      updated_at: string
    }

    /** 项目详情响应 */
    interface ProjectDetailResponse {
      success: boolean
      message: string
      project: ProjectResponse
    }

    /** 项目列表响应 */
    interface ProjectListResponse {
      success: boolean
      message: string
      projects: ProjectResponse[]
      total_count: number
      page: number
      page_size: number
      total_pages: number
    }

    /** 项目删除请求 */
    interface ProjectDeleteRequest {
      project_ids: number[]
    }

    /** 项目删除响应 */
    interface ProjectDeleteResponse {
      success: boolean
      message: string
      deleted_count: number
      failed_count: number
      details?: any[]
    }

    /** 项目状态更新请求 */
    interface ProjectStatusUpdateRequest {
      status: string
    }

    /** 项目组件更新请求 */
    interface ProjectComponentUpdateRequest {
      current_component: string
    }

    /** 项目统计响应 */
    interface ProjectStatisticsResponse {
      success: boolean
      message: string
      data: Record<string, number>
    }
  }

  /** AI 服务类型 */
  namespace Ai {
    /** 基础响应类型 */
    interface BaseResponse {
      success: boolean
      message?: string
      error?: string | null
    }

    /** 任务响应基础类型 */
    interface TaskResponse extends BaseResponse {
      task_id: string
    }

    /** 网页总结相关类型 */
    interface WebpageSummaryAsyncRequest {
      url: string
      model_name?: string
      max_tokens?: number
      scraping_timeout?: number
      max_content_length?: number
      target_format?: Record<string, any>
    }

    interface WebpageSummaryAsyncResponse extends TaskResponse {
      url: string
    }

    interface WebpageSummaryStatusResponse extends BaseResponse {
      task_id: string
      status: string
      progress: number
      result?: {
        summary: string
        key_excerpts: string[]
        word_count: number
        reading_time: number
        topics: string[]
      } | null
    }

    /** Scope Agent 相关类型 */
    interface ScopeAgentRequest {
      query: string
    }

    interface ScopeAgentResponse extends TaskResponse {
      user_id: string
      project_id: string
      agent_type: string
    }

    interface ScopeAgentStatusResponse {
      task_id: string
      status: string
      progress: number
      result?: Record<string, any> | null
      error?: string | null
      user_id: string
      project_id: string
      agent_type: string
      created_at: number
      updated_at: number
    }

    interface ScopeAgentListResponse {
      tasks: ScopeAgentStatusResponse[]
      total_count: number
      user_id: string
      project_id?: string | null
    }

    /** Search Agent 相关类型 */
    interface SearchAgentRequest {
      brief: string
      max_concurrent_research_units?: number | null
      max_researcher_iterations?: number | null
    }

    interface SearchAgentResponse extends TaskResponse {
      user_id: string
      project_id: string
      agent_type: string
    }

    interface SearchAgentStatusResponse {
      task_id: string
      status: string
      progress: number
      result?: Record<string, any> | null
      error?: string | null
      user_id: string
      project_id: string
      agent_type: string
      created_at: number
      updated_at: number
    }

    interface SearchAgentListResponse {
      tasks: SearchAgentStatusResponse[]
      total_count: number
      user_id: string
      project_id?: string | null
    }

    /** 搜索工具相关类型 */
    interface SearchResultItem {
      url: string
      score: number
      query: string
      aititle?: string | null
      summary?: string | null
      tags: string[]
      key_excerpts: string[]
      published_date?: string | null
    }

    interface SearchToolsRequest {
      queries: string[]
      provider: 'tavily' | 'bocha'
      max_results?: number
      enable_structured_summaries?: boolean
      summarization_model?: string | null
      max_content_length?: number
      topic?: 'general' | 'news' | 'finance' | null
      include_raw_content?: boolean | null
      freshness?: string | null
      summary?: boolean | null
      include?: string | null
      exclude?: string | null
    }

    interface SearchToolsResponse extends BaseResponse {
      provider: string
      results: SearchResultItem[]
      total_results: number
      search_queries: string[]
      search_time: number
      api_execution_time: number
      query_count: number
    }

    interface SearchToolsStatusResponse {
      tavily_configured: boolean
      bocha_configured: boolean
      tavily_api_key_status: string
      bocha_api_key_status: string
      default_provider: string
      available_providers: string[]
    }

    /** 标题生成相关类型 */
    interface Title {
      title: string
      angle: string
      why_now: string
      news_values: string[]
      verifiability: string
      sources: string[]
      risk_notes: string
      feasibility: string
    }

    interface TitleGenerationRequest {
      research_brief: string
      web_search_data: SearchResultItem[] | string[]
    }

    interface TitleGenerationResponse extends BaseResponse {
      titles: Title[]
      title_sources_details: Record<string, any[]>
      generation_time: number
      title_count: number
      generation_summary: string
      total_candidates: number
      final_report: string
    }

    interface TitleToolsStatusResponse {
      configured: boolean
      available_models: string[]
      default_model: string
    }

    /** 大纲生成相关类型 */
    interface OutlineSection {
      level: number
      title: string
      content_direction: string
      data_requirements: string[]
      estimated_word_count?: number | null
      priority: 'high' | 'medium' | 'low'
      sources: string[]
    }

    interface OutlineGenerationRequest {
      title: Title
      research_brief: string
      web_search_data: SearchResultItem[] | string[]
    }

    interface OutlineGenerationResponse extends BaseResponse {
      outline: OutlineSection[]
      outline_sources_details: Record<string, any[]>
      generation_time: number
      section_count: number
      generation_summary: string
      total_word_estimate?: number | null
      final_report: string
    }

    interface OutlineGenerationStatusResponse {
      configured: boolean
      available_models: string[]
      default_model: string
    }

    /** 任务取消相关类型 */
    interface TaskCancelRequest {
      task_id: string
      terminate?: boolean
      signal?: string | null
    }

    /** 验证错误类型 */
    interface ValidationError {
      loc: (string | number)[]
      msg: string
      type: string
    }

    interface HTTPValidationError {
      detail: ValidationError[]
    }

    /** 通用任务状态类型 */
    interface TaskStatus {
      task_id: string
      status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
      progress: number
      result?: any
      error?: string
      created_at: number
      updated_at: number
    }

    /** 提供商信息类型 */
    interface ProviderInfo {
      name: string
      description: string
      capabilities: string[]
      status: 'active' | 'inactive' | 'error'
    }

    interface ProvidersResponse {
      [providerName: string]: ProviderInfo
    }
  }

  /** 素材管理类型 */
  namespace Material {
    /** 素材响应 */
    interface MaterialResponse {
      id: number
      title: string
      summary: string
      url?: string
      score?: number
      key_excerpts?: string[]
      user_id: number
      created_at: string
      updated_at: string
      tags: string[]
    }

    /** 素材列表响应 */
    interface MaterialListResponse {
      success: boolean
      message: string
      materials: MaterialResponse[]
      total_count: number
      page: number
      page_size: number
      total_pages: number
    }

    /** 创建素材请求 */
    interface MaterialCreateRequest {
      title: string
      summary: string
      url?: string
      score?: number
      key_excerpts?: string[]
      tags?: string[]
    }

    /** 批量添加完整素材请求 */
    interface AddCompleteMaterialRequest {
      project_id: number
      materials: CompleteMaterialData[]
    }

    interface CompleteMaterialData {
      title: string
      summary: string
      url?: string
      score?: number
      key_excerpts?: string[]
      tags?: string[]
    }

    /** 更新素材请求 */
    interface MaterialUpdateRequest {
      update_data: Partial<MaterialCreateRequest>
    }

    /** 删除素材请求 */
    interface MaterialDeleteRequest {
      material_ids: number[]
    }

    /** 删除素材响应 */
    interface MaterialDeleteResponse {
      success: boolean
      message: string
      deleted_count: number
      failed_count: number
      details?: any[]
    }

    /** 创建标签请求 */
    interface TagCreateRequest {
      name: string
    }

    /** 标签响应 */
    interface TagResponse {
      id: number
      name: string
      is_system: boolean
      material_count: number
      created_at: string
    }

    /** 搜索素材请求 */
    interface MaterialSearchRequest {
      keywords: string
      filters?: object
      project_id?: number
    }

    /** 素材统计请求 */
    interface MaterialStatsRequest {
      project_id?: number
      group_by?: string
    }
  }
}

// 导出命名空间作为模块
export { Api }
