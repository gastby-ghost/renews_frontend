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
  }

  /** 用户类型 */
  namespace User {
    /** 用户信息 */
    interface UserInfo {
      userId: number
      userName: string
      roles: string[]
      buttons: string[]
      avatar?: string
      email?: string
      phone?: string
      // 扩展字段
      id?: number
      nickName?: string
      userGender?: string
      userPhone?: string
      userEmail?: string
      userRoles?: string[]
      status?: '1' | '2' | '3' | '4' // 1: 在线 2: 离线 3: 异常 4: 注销
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    /** 用户列表数据 */
    interface UserListData {
      records: UserListItem[]
      current: number
      size: number
      total: number
    }

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
      status: '1' | '2' | '3' | '4' // 1: 在线 2: 离线 3: 异常 4: 注销
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
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
}
