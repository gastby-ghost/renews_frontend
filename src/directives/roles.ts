import { useUserStore } from '@/store/modules/user'
import { App, Directive } from 'vue'

/**
 * 角色权限指令
 * 简化版本：不再检查角色权限，所有登录用户都可以看到所有元素
 * 保留指令以维持向后兼容性
 * 用法：
 * <el-button v-roles="['R_SUPER', 'R_ADMIN']">按钮</el-button>
 * <el-button v-roles="'R_ADMIN'">按钮</el-button>
 */

function checkRolePermission(el: HTMLElement): void {
  const userStore = useUserStore()

  // 简化权限检查：只检查用户是否已登录
  // 如果用户未登录，移除元素
  if (!userStore.isLogin) {
    removeElement(el)
    return
  }

  // 所有登录用户都可以看到所有元素，不再检查角色权限
  // 保留逻辑结构以维持向后兼容性
}

function removeElement(el: HTMLElement): void {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

const rolesDirective: Directive = {
  mounted: checkRolePermission,
  updated: checkRolePermission
}

export function setupRolesDirective(app: App): void {
  app.directive('roles', rolesDirective)
}
