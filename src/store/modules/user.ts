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
import { AuthService } from '@/api/authApi'
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
    // 用户信息
    const info = ref<Partial<Api.User.UserInfo>>({})
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

    // 计算属性：获取用户信息
    const getUserInfo = computed(() => info.value)
    // 计算属性：获取设置状态
    const getSettingState = computed(() => useSettingStore().$state)
    // 计算属性：获取工作台状态
    const getWorktabState = computed(() => useWorktabStore().$state)

    /**
     * 设置用户信息
     * @param newInfo 新的用户信息
     */
    const setUserInfo = (newInfo: Api.User.UserInfo | Api.Auth.UserResponse) => {
      // 处理不同格式的用户信息
      if ('id' in newInfo && 'username' in newInfo) {
        // UserResponse格式 -> UserInfo格式转换
        const userInfo: Api.User.UserInfo = {
          userId: newInfo.id,
          userName: newInfo.username,
          roles: newInfo.roles || [],
          buttons: [],
          avatar: newInfo.avatar,
          email: newInfo.email,
          phone: '',
          // 扩展字段
          id: newInfo.id,
          nickName: newInfo.username,
          userEmail: newInfo.email,
          userRoles: newInfo.roles || [],
          status: newInfo.is_active ? '1' : '2'
        }
        info.value = userInfo
      } else {
        // 已经是UserInfo格式
        info.value = newInfo as Api.User.UserInfo
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

        const response = await AuthService.refreshToken(refreshToken.value)

        if (response.success && response.token) {
          setToken(
            response.token,
            response.refresh_token || refreshToken.value,
            response.expires_in || undefined
          )
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
    const loginWithAuthResponse = (authResponse: Api.Auth.AuthResponse) => {
      console.log('[UserStore] 处理登录响应:', authResponse)

      if (authResponse.success && authResponse.token) {
        // 设置令牌
        setToken(
          authResponse.token,
          authResponse.refresh_token || undefined,
          authResponse.expires_in || undefined
        )

        // 设置用户信息
        if (authResponse.user) {
          console.log('[UserStore] 设置用户信息:', authResponse.user)
          setUserInfo(authResponse.user)
        }

        // 设置登录状态
        setLoginStatus(true)

        // 设置自动令牌刷新
        setupTokenRefresh()

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

      // 调用登出API
      try {
        await AuthService.logout()
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
      getUserInfo,
      getSettingState,
      getWorktabState,
      setUserInfo,
      setLoginStatus,
      setLanguage,
      setSearchHistory,
      setLockStatus,
      setLockPassword,
      setToken,
      refreshAccessToken,
      setupTokenRefresh,
      loginWithAuthResponse,
      logOut
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage
    }
  }
)
