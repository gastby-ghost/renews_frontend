import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { ref, nextTick } from 'vue'
import NProgress from 'nprogress'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { setWorktab } from '@/utils/navigation'
import { setPageTitle, setSystemTheme } from '../utils/utils'
import { registerDynamicRoutes } from '../utils/registerRoutes'
import { AppRouteRecord } from '@/types/router'
import { RoutesAlias } from '../routesAlias'
import { menuDataToRouter } from '../utils/menuToRouter'
import { asyncRoutes } from '../routes/asyncRoutes'
import { loadingService } from '@/utils/ui'
import { useCommon } from '@/composables/useCommon'
import { useWorktabStore } from '@/store/modules/worktab'
import { isAuthenticated } from '@/utils/auth'

// 前端权限模式 loading 关闭延时，提升用户体验
const LOADING_DELAY = 100

// 是否已注册动态路由
const isRouteRegistered = ref(false)

// 跟踪是否需要关闭 loading
const pendingLoading = ref(false)

/**
 * 设置路由全局前置守卫
 */
export function setupBeforeEachGuard(router: Router): void {
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      try {
        await handleRouteGuard(to, from, next, router)
      } catch (error) {
        console.error('路由守卫处理失败:', error)
        next('/exception/500')
      }
    }
  )

  // 设置后置守卫以关闭 loading 和进度条
  setupAfterEachGuard(router)
}

/**
 * 设置路由全局后置守卫
 */
function setupAfterEachGuard(router: Router): void {
  router.afterEach(() => {
    // 关闭进度条
    const settingStore = useSettingStore()
    if (settingStore.showNprogress) {
      NProgress.done()
    }

    // 关闭 loading 效果
    if (pendingLoading.value) {
      nextTick(() => {
        loadingService.hideLoading()
        pendingLoading.value = false
      })
    }
  })
}

/**
 * 处理路由守卫逻辑
 */
async function handleRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  const settingStore = useSettingStore()
  const userStore = useUserStore()

  // 处理进度条
  if (settingStore.showNprogress) {
    NProgress.start()
  }

  // 设置系统主题
  setSystemTheme(to)

  // 处理登录状态
  if (!(await handleLoginStatus(to, userStore, next))) {
    return
  }

  // 处理动态路由注册
  if (!isRouteRegistered.value && userStore.isLogin) {
    await handleDynamicRoutes(to, from, next, router)
    return
  }

  // 处理根路径跳转到首页
  if (userStore.isLogin && isRouteRegistered.value && handleRootPathRedirect(to, next)) {
    return
  }

  // 处理已知的匹配路由
  if (to.matched.length > 0) {
    setWorktab(to)
    setPageTitle(to)
    next()
    return
  }

  // 尝试刷新路由重新注册
  if (userStore.isLogin && !isRouteRegistered.value) {
    await handleDynamicRoutes(to, from, next, router)
    return
  }

  // 未匹配到路由，跳转到 404
  next(RoutesAlias.Exception404)
}

/**
 * 处理登录状态
 */
async function handleLoginStatus(
  to: RouteLocationNormalized,
  userStore: ReturnType<typeof useUserStore>,
  next: NavigationGuardNext
): Promise<boolean> {
  // 检查登录状态和令牌有效性
  const isUserLoggedIn = userStore.isLogin && isAuthenticated(userStore.accessToken)

  // 如果用户未登录但访问的是非登录页面且不需要登录的页面，允许访问
  if (!isUserLoggedIn && to.path !== RoutesAlias.Login && !to.meta.noLogin) {
    console.log('[Router Guard] 用户未登录，重定向到登录页')
    userStore.logOut()
    next(RoutesAlias.Login)
    return false
  }

  // 如果用户已登录但访问登录页，重定向到首页
  if (isUserLoggedIn && to.path === RoutesAlias.Login) {
    console.log('[Router Guard] 用户已登录，重定向到首页')
    const { homePath } = useCommon()
    if (homePath.value) {
      next({ path: homePath.value, replace: true })
      return false
    }
  }

  // 如果用户状态与令牌状态不一致，进行状态同步
  if (userStore.accessToken && !userStore.isLogin) {
    console.log('[Router Guard] 检测到令牌存在但登录状态为false，尝试初始化认证状态')
    const authValid = userStore.initializeAuthState()
    if (!authValid) {
      console.log('[Router Guard] 认证状态初始化失败，重定向到登录页')
      userStore.logOut()
      next(RoutesAlias.Login)
      return false
    }
  }

  return true
}

/**
 * 处理动态路由注册
 */
async function handleDynamicRoutes(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  try {
    // 显示 loading 并标记 pending
    pendingLoading.value = true
    loadingService.showLoading()

    // 获取用户信息
    const userStore = useUserStore()
    const isRefresh = from.path === '/'
    if (isRefresh || !userStore.info || Object.keys(userStore.info).length === 0) {
      try {
        // 如果用户信息为空，但用户已登录，尝试验证令牌有效性
        console.log('[Router Guard] 用户信息为空，但用户已登录，验证令牌有效性')

        // 验证认证状态的完整性
        const authStateValid = userStore.initializeAuthState()

        if (!authStateValid) {
          console.log('[Router Guard] 认证状态验证失败，重定向到登录页')
          userStore.logOut()
          next(RoutesAlias.Login)
          return
        }

        // 设置自动令牌刷新
        userStore.setupTokenRefresh()
      } catch (error) {
        console.error('处理用户信息失败', error)
        // 如果处理用户信息失败，可能是令牌过期，尝试登出
        if (!isAuthenticated(userStore.accessToken)) {
          userStore.logOut()
          next(RoutesAlias.Login)
          return
        }
      }
    }

    await getMenuData(router)

    // 处理根路径跳转
    if (handleRootPathRedirect(to, next)) {
      return
    }

    next({
      path: to.path,
      query: to.query,
      hash: to.hash,
      replace: true
    })
  } catch (error) {
    console.error('动态路由注册失败:', error)
    next('/exception/500')
  }
}

/**
 * 获取菜单数据
 */
async function getMenuData(router: Router): Promise<void> {
  try {
    if (useCommon().isFrontendMode.value) {
      await processFrontendMenu(router)
    } else {
      await processBackendMenu(router)
    }
  } catch (error) {
    handleMenuError(error)
    throw error
  }
}

/**
 * 处理前端控制模式的菜单逻辑
 */
async function processFrontendMenu(router: Router): Promise<void> {
  const menuList = asyncRoutes.map((route) => menuDataToRouter(route))

  // 简化权限检查，不再基于角色过滤菜单
  // 所有登录用户都可以访问所有菜单

  // 添加延时以提升用户体验
  await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY))

  await registerAndStoreMenu(router, menuList)
}

/**
 * 处理后端控制模式的菜单逻辑
 * 由于config/api中没有menu模块，这里转为前端实现
 */
async function processBackendMenu(router: Router): Promise<void> {
  // 使用前端菜单数据替代后端菜单API
  const menuList = asyncRoutes.map((route) => menuDataToRouter(route))

  // 添加延时以提升用户体验
  await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY))

  await registerAndStoreMenu(router, menuList)
}

/**
 * 递归过滤空菜单项
 */
function filterEmptyMenus(menuList: AppRouteRecord[]): AppRouteRecord[] {
  return menuList
    .map((item) => {
      // 如果有子菜单，先递归过滤子菜单
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterEmptyMenus(item.children)
        return {
          ...item,
          children: filteredChildren
        }
      }
      return item
    })
    .filter((item) => {
      // 过滤掉布局组件且没有子菜单的项
      const isEmptyLayoutMenu =
        item.component === RoutesAlias.Layout && (!item.children || item.children.length === 0)

      // 过滤掉组件为空字符串且没有子菜单的项
      const isEmptyComponentMenu =
        item.component === '' &&
        (!item.children || item.children.length === 0) &&
        item.meta.isIframe !== true

      return !(isEmptyLayoutMenu || isEmptyComponentMenu)
    })
}

/**
 * 注册路由并存储菜单数据
 */
async function registerAndStoreMenu(router: Router, menuList: AppRouteRecord[]): Promise<void> {
  if (!isValidMenuList(menuList)) {
    throw new Error('获取菜单列表失败，请重新登录')
  }
  const menuStore = useMenuStore()
  // 递归过滤掉为空的菜单项
  const list = filterEmptyMenus(menuList)
  menuStore.setMenuList(list)
  registerDynamicRoutes(router, list)
  isRouteRegistered.value = true
  useWorktabStore().validateWorktabs(router)
}

/**
 * 处理菜单相关错误
 */
function handleMenuError(error: unknown): void {
  console.error('菜单处理失败:', error)
  useUserStore().logOut()
  throw error instanceof Error ? error : new Error('获取菜单列表失败，请重新登录')
}

/**
 * 验证菜单列表是否有效
 */
function isValidMenuList(menuList: AppRouteRecord[]): boolean {
  return Array.isArray(menuList) && menuList.length > 0
}

/**
 * 重置路由相关状态
 */
export function resetRouterState(): void {
  isRouteRegistered.value = false
  const menuStore = useMenuStore()
  menuStore.removeAllDynamicRoutes()
  menuStore.setMenuList([])
}

/**
 * 处理根路径跳转到首页
 */
function handleRootPathRedirect(to: RouteLocationNormalized, next: NavigationGuardNext): boolean {
  if (to.path === '/') {
    const { homePath } = useCommon()
    if (homePath.value) {
      next({ path: homePath.value, replace: true })
      return true
    }
  }
  return false
}
