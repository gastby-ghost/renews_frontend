import { router } from '@/router'
import { App, Directive, DirectiveBinding } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { hasButtonPermission } from '@/utils/auth'

/**
 * 权限指令（后端控制模式可用）
 * 用法：
 * <el-button v-auth="'add'">按钮</el-button>
 */

interface AuthBinding extends DirectiveBinding {
  value: string
}

function checkAuthPermission(el: HTMLElement, binding: AuthBinding): void {
  // 获取当前路由的权限列表
  const authList = (router.currentRoute.value.meta.authList as Array<{ authMark: string }>) || []

  // 检查是否有对应的权限标识
  const hasRoutePermission = authList.some((item) => item.authMark === binding.value)

  // 检查用户是否有按钮权限
  const userStore = useUserStore()
  const { info } = storeToRefs(userStore)
  const userButtons = info.value?.buttons ?? []
  const hasButtonAuth = hasButtonPermission(userButtons, binding.value)

  // 如果没有权限，移除元素
  if (!hasRoutePermission && !hasButtonAuth) {
    removeElement(el)
  }
}

function removeElement(el: HTMLElement): void {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

const authDirective: Directive = {
  mounted: checkAuthPermission,
  updated: checkAuthPermission
}

export function setupAuthDirective(app: App): void {
  app.directive('auth', authDirective)
}
