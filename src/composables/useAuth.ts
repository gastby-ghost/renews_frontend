import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { useCommon } from '@/composables/useCommon'
import { hasPermission, hasButtonPermission, isTokenExpired } from '@/utils/auth'
import type { AppRouteRecord } from '@/types/router'

type AuthItem = NonNullable<AppRouteRecord['meta']['authList']>[number]

const userStore = useUserStore()

/**
 * 按钮权限（前后端模式通用）
 * 用法：
 * const { hasAuth } = useAuth()
 * hasAuth('add') // 检查是否拥有新增权限
 */
export const useAuth = () => {
  const route = useRoute()
  const { isFrontendMode } = useCommon()
  const { info } = storeToRefs(userStore)

  // 前端按钮权限（例如：['add', 'edit']）
  const frontendAuthList = info.value?.buttons ?? []

  // 后端路由 meta 配置的权限列表（例如：[{ authMark: 'add' }]）
  const backendAuthList: AuthItem[] = Array.isArray(route.meta.authList)
    ? (route.meta.authList as AuthItem[])
    : []

  /**
   * 检查是否拥有某权限标识（前后端模式通用）
   * @param auth 权限标识
   * @returns 是否有权限
   */
  const hasAuth = (auth: string): boolean => {
    // 前端模式
    if (isFrontendMode.value) {
      return hasButtonPermission(frontendAuthList, auth)
    }

    // 后端模式
    return backendAuthList.some((item) => item?.authMark === auth)
  }

  /**
   * 检查是否拥有特定角色权限
   * @param roles 需要的角色列表
   * @returns 是否有权限
   */
  const hasRole = (roles: string[]): boolean => {
    const userRoles = info.value?.roles ?? []
    return hasPermission(userRoles, roles)
  }

  /**
   * 检查用户是否已认证
   * @returns 是否已认证
   */
  const isAuthenticated = (): boolean => {
    const { accessToken, isLogin } = storeToRefs(userStore)

    // 检查是否有访问令牌
    if (!accessToken.value) {
      return false
    }

    // 检查登录状态是否一致
    if (!isLogin.value) {
      return false
    }

    // 检查令牌是否过期
    try {
      return !isTokenExpired(accessToken.value)
    } catch (error) {
      console.error('检查令牌过期状态失败:', error)
      return false
    }
  }

  return {
    hasAuth,
    hasRole,
    isAuthenticated
  }
}
