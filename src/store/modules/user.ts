import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { LanguageEnum } from '@/enums/appEnum'
import { router } from '@/router'
import { useSettingStore } from './setting'
import { useWorktabStore } from './worktab'
import { AppRouteRecord } from '@/types/router'
import { setPageTitle } from '@/router/utils/utils'
import { resetRouterState } from '@/router/guards/beforeEach'
import { RoutesAlias } from '@/router/routesAlias'
import { useMenuStore } from './menu'
import { authManager } from '@/services/auth/AuthManager'
import { apiConfigManager } from '@/config/api'
import { isTokenExpired, parseToken } from '@/utils/auth'

/**
 * 用户状态管理
 * 管理用户登录状态、个人信息、语言设置、搜索历史、锁屏状态等
 */
export const useUserStore = defineStore(
  'userStore',
  () => {
    // 语言设置
    const language = ref(LanguageEnum.ZH)
    // 登录状态
    const isLogin = ref(false)
    // 锁屏状态
    const isLock = ref(false)
    // 锁屏密码
    const lockPassword = ref('')
    // 用户信息 - 仅存储来自 core API 的必要字段
    const info = ref<Partial<Api.Auth.UserResponse>>({})
    // 搜索历史记录
    const searchHistory = ref<AppRouteRecord[]>([])
    // 访问令牌
    const accessToken = ref('')
    // 刷新令牌
    const refreshToken = ref('')
    // 令牌过期时间
    const tokenExpiresAt = ref<number>(0)
    // 令牌刷新定时器
    let tokenRefreshTimer: NodeJS.Timeout | null = null
    // 用户类型：'real' | 'mock' - 用于区分真实用户和模拟用户
    const userType = ref<'real' | 'mock'>('real')

    // 计算属性：获取用户信息
    const getUserInfo = computed(() => info.value)
    // 计算属性：获取设置状态
    const getSettingState = computed(() => useSettingStore().$state)
    // 计算属性：获取工作台状态
    const getWorktabState = computed(() => useWorktabStore().$state)

    /**
     * 设置用户类型
     * @param type 用户类型：'real' | 'mock'
     */
    const setUserType = (type: 'real' | 'mock') => {
      userType.value = type
    }

    /**
     * 获取用户类型
     */
    const getUserType = computed(() => userType.value)

    /**
     * 设置用户信息 - 仅存储来自 core API 的必要字段
     * @param newInfo 新的用户信息 (UserResponse 格式)
     */
    const setUserInfo = (newInfo: Api.Auth.UserResponse | Api.Auth.AccountSettingsResponse) => {
      // 处理 AccountSettingsResponse 格式
      if ('data' in newInfo) {
        info.value = {
          id: newInfo.data.id,
          username: newInfo.data.username,
          email: newInfo.data.email,
          is_active: newInfo.data.is_active,
          is_verified: newInfo.data.is_verified,
          created_at: newInfo.data.created_at,
          updated_at: newInfo.data.updated_at,
          avatar: newInfo.data.avatar,
          roles: newInfo.data.roles || []
        }
      } else {
        // 处理 UserResponse 格式
        info.value = {
          id: newInfo.id,
          username: newInfo.username,
          email: newInfo.email,
          is_active: newInfo.is_active,
          is_verified: newInfo.is_verified,
          created_at: newInfo.created_at,
          updated_at: newInfo.updated_at,
          avatar: newInfo.avatar,
          roles: newInfo.roles || []
        }
      }
    }

    /**
     * 设置登录状态
     * @param status 登录状态
     */
    const setLoginStatus = (status: boolean) => {
      isLogin.value = status
    }

    /**
     * 设置语言
     * @param lang 语言枚举值
     */
    const setLanguage = (lang: LanguageEnum) => {
      setPageTitle(router.currentRoute.value)
      language.value = lang
    }

    /**
     * 设置搜索历史
     * @param list 搜索历史列表
     */
    const setSearchHistory = (list: AppRouteRecord[]) => {
      searchHistory.value = list
    }

    /**
     * 设置锁屏状态
     * @param status 锁屏状态
     */
    const setLockStatus = (status: boolean) => {
      isLock.value = status
    }

    /**
     * 设置锁屏密码
     * @param password 锁屏密码
     */
    const setLockPassword = (password: string) => {
      lockPassword.value = password
    }

    /**
     * 设置令牌
     * @param newAccessToken 访问令牌
     * @param newRefreshToken 刷新令牌（可选）
     * @param expiresIn 过期时间（秒，可选）
     */
    const setToken = (newAccessToken: string, newRefreshToken?: string, expiresIn?: number) => {
      accessToken.value = newAccessToken
      if (newRefreshToken) {
        refreshToken.value = newRefreshToken
      }

      // 设置令牌过期时间
      if (expiresIn) {
        tokenExpiresAt.value = Date.now() + expiresIn * 1000
      } else if (newAccessToken) {
        // 如果没有提供过期时间，尝试从令牌中解析
        try {
          const tokenData = parseToken(newAccessToken)
          if (tokenData.exp) {
            tokenExpiresAt.value = tokenData.exp * 1000
          }
        } catch (error) {
          console.warn('无法解析令牌过期时间:', error)
          // 设置默认过期时间（1小时）
          tokenExpiresAt.value = Date.now() + 60 * 60 * 1000
        }
      }
    }

    /**
     * 刷新访问令牌
     * @returns 是否刷新成功
     */
    const refreshAccessToken = async (): Promise<boolean> => {
      try {
        if (!refreshToken.value) {
          console.warn('没有可用的刷新令牌')
          return false
        }

        // 使用 authManager 来刷新令牌
        const success = await authManager.refreshAccessToken(refreshToken.value)

        if (success) {
          // 如果刷新成功，需要从响应中获取新令牌并更新
          // 这里可能需要根据实际实现来获取新令牌
          console.log('[UserStore] 令牌刷新成功')
          return true
        }

        return false
      } catch (error) {
        console.error('刷新令牌失败:', error)
        return false
      }
    }

    /**
     * 设置自动令牌刷新
     * 启动定时器，在令牌过期前自动刷新
     */
    const setupTokenRefresh = () => {
      // 清除现有的定时器
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
        tokenRefreshTimer = null
      }

      // 如果没有访问令牌或刷新令牌，不设置自动刷新
      if (!accessToken.value || !refreshToken.value) {
        return
      }

      // 计算刷新时间（在过期前5分钟刷新）
      const refreshTime = tokenExpiresAt.value - 5 * 60 * 1000
      const currentTime = Date.now()

      // 如果令牌已经过期或即将过期（30秒内），立即刷新
      if (currentTime >= refreshTime || isTokenExpired(accessToken.value)) {
        refreshAccessToken()
        return
      }

      // 设置定时器
      const delay = refreshTime - currentTime
      tokenRefreshTimer = setTimeout(async () => {
        const success = await refreshAccessToken()
        if (success) {
          // 刷新成功，重新设置定时器
          setupTokenRefresh()
        } else {
          // 刷新失败，执行登出
          logOut()
        }
      }, delay)
    }

    /**
     * 更新登录方法以支持新的AuthResponse结构
     * @param authResponse 认证响应
     */
    const loginWithAuthResponse = async (authResponse: Api.Auth.AuthResponse): Promise<boolean> => {
      console.log('[UserStore] 处理登录响应:', authResponse)

      if (authResponse.success && authResponse.token) {
        // 获取当前API配置，判断用户类型
        const apiConfig = apiConfigManager.getConfig()
        const currentUserType = apiConfig.useMock ? 'mock' : 'real'

        // 设置用户类型
        setUserType(currentUserType)
        console.log(`[UserStore] 用户类型设置为: ${currentUserType}`)

        // 设置令牌
        setToken(
          authResponse.token,
          authResponse.refresh_token || undefined,
          authResponse.expires_in || undefined
        )

        // 设置登录状态
        setLoginStatus(true)

        // 设置自动令牌刷新
        setupTokenRefresh()

        // 如果登录响应中包含用户信息，先设置
        if (authResponse.user) {
          console.log('[UserStore] 设置登录响应中的用户信息:', authResponse.user)
          setUserInfo(authResponse.user as Api.Auth.UserResponse)
        }

        // 使用 token 从 API 获取最新的用户信息
        console.log('[UserStore] 使用 token 获取最新用户信息')
        const fetchSuccess = await fetchUserInfo()

        if (!fetchSuccess) {
          console.warn('[UserStore] 获取最新用户信息失败，但登录仍然成功')
        }

        console.log('[UserStore] 登录成功，用户状态:', info.value)
        return true
      }

      console.log('[UserStore] 登录失败:', authResponse)
      return false
    }

    /**
     * 退出登录
     * 清空所有用户相关状态并跳转到登录页
     */
    const logOut = async () => {
      // 清除令牌刷新定时器
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer)
        tokenRefreshTimer = null
      }

      // 使用 authManager 调用登出API
      try {
        await authManager.handleLogout()
      } catch (error) {
        console.error('登出API调用失败:', error)
      }

      // 清空用户信息
      info.value = {}
      // 重置登录状态
      isLogin.value = false
      // 重置锁屏状态
      isLock.value = false
      // 清空锁屏密码
      lockPassword.value = ''
      // 清空访问令牌
      accessToken.value = ''
      // 清空刷新令牌
      refreshToken.value = ''
      // 清空令牌过期时间
      tokenExpiresAt.value = 0
      // 重置用户类型为默认值
      userType.value = 'real'

      // 清空工作台已打开页面
      useWorktabStore().opened = []
      // 移除iframe路由缓存
      sessionStorage.removeItem('iframeRoutes')
      // 清空主页路径
      useMenuStore().setHomePath('')
      // 重置路由状态
      resetRouterState()
      // 跳转到登录页
      router.push(RoutesAlias.Login)
    }

    /**
     * 初始化认证状态验证
     * 在应用启动时验证存储的认证状态是否有效
     * @returns 是否验证通过
     */
    const initializeAuthState = async (): Promise<boolean> => {
      console.log('[UserStore] 初始化认证状态验证')

      // 如果没有访问令牌，直接返回false
      if (!accessToken.value) {
        console.log('[UserStore] 没有访问令牌，设置登录状态为false')
        setLoginStatus(false)
        return false
      }

      // 根据token类型设置用户类型
      if (accessToken.value.startsWith('mock-')) {
        console.log('[UserStore] 检测到Mock token，设置用户类型为mock')
        setUserType('mock')
      } else {
        console.log('[UserStore] 检测到真实token，设置用户类型为real')
        setUserType('real')
      }

      // 检查令牌是否过期
      if (isTokenExpired(accessToken.value)) {
        console.log('[UserStore] 访问令牌已过期，设置登录状态为false')
        setLoginStatus(false)
        // 清空过期的令牌
        setToken('', '')
        return false
      }

      // 如果有令牌且未过期，但登录状态为false，则更新登录状态
      if (!isLogin.value) {
        console.log('[UserStore] 令牌有效但登录状态为false，更新登录状态')
        setLoginStatus(true)
        // 设置自动令牌刷新
        setupTokenRefresh()
      }

      // 尝试获取最新的用户信息
      console.log('[UserStore] 令牌有效，尝试获取最新用户信息')
      const userInfoSuccess = await fetchUserInfo()

      if (!userInfoSuccess) {
        console.warn('[UserStore] 获取用户信息失败，但令牌仍然有效')
      }

      console.log('[UserStore] 认证状态验证完成，当前登录状态:', isLogin.value)
      return isLogin.value
    }

    /**
     * 获取用户账户信息
     * 使用 token 从 API 获取最新的用户信息
     * @returns 是否获取成功
     */
    const fetchUserInfo = async (): Promise<boolean> => {
      try {
        console.log('[UserStore] 开始获取用户账户信息')

        // 检查是否有访问令牌
        if (!accessToken.value) {
          console.warn('[UserStore] 没有访问令牌，无法获取用户信息')
          return false
        }

        // 使用 authManager 获取 authService
        const authService = authManager.getAuthService()
        const response = await authService.getAccount()

        if (response && response.success && response.data) {
          console.log('[UserStore] 成功获取用户信息:', response.data)
          // 使用 API 返回的用户信息更新 store
          setUserInfo(response as Api.Auth.AccountSettingsResponse)
          return true
        }

        console.error('[UserStore] 获取用户信息失败:', response)
        return false
      } catch (error) {
        console.error('[UserStore] 获取用户信息时发生错误:', error)
        return false
      }
    }

    /**
     * 初始化用户信息
     * 在应用启动或登录后调用，获取并存储用户信息
     * @returns 是否初始化成功
     */
    const initializeUserInfo = async (): Promise<boolean> => {
      // 如果已经有用户信息，直接返回成功
      if (info.value && info.value.id) {
        console.log('[UserStore] 用户信息已存在，跳过初始化')
        return true
      }

      // 尝试从 API 获取用户信息
      const success = await fetchUserInfo()

      if (success) {
        console.log('[UserStore] 用户信息初始化成功')
      } else {
        console.warn('[UserStore] 用户信息初始化失败，可能需要重新登录')
        // 如果获取用户信息失败，可能是 token 无效，执行登出
        await logOut()
      }

      return success
    }

    return {
      language,
      isLogin,
      isLock,
      lockPassword,
      info,
      searchHistory,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      userType,
      getUserInfo,
      getSettingState,
      getWorktabState,
      getUserType,
      setUserInfo,
      setLoginStatus,
      setLanguage,
      setSearchHistory,
      setLockStatus,
      setLockPassword,
      setToken,
      setUserType,
      refreshAccessToken,
      setupTokenRefresh,
      loginWithAuthResponse,
      logOut,
      initializeAuthState,
      fetchUserInfo,
      initializeUserInfo
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage,
      // 持久化用户类型，以便在页面刷新后保持用户类型信息
      paths: [
        'language',
        'isLogin',
        'isLock',
        'lockPassword',
        'info',
        'searchHistory',
        'accessToken',
        'refreshToken',
        'tokenExpiresAt',
        'userType'
      ]
    }
  }
)
