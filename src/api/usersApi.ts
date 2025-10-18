import request from '@/utils/http'
import { AuthService } from './authApi'

export class UserService {
  // 登录 - 使用新的认证API
  static login(params: Api.Auth.UserLoginRequest) {
    return AuthService.login(params)
  }

  // 获取用户信息
  static getUserInfo() {
    return request.get<Api.Auth.UserResponse>({
      url: '/api/v1/core/account'
    })
  }

  // 以下用户管理相关方法已被移除:
  // - getUserList(): 获取用户列表
  // - createUser(): 创建用户
  // - updateUser(): 更新用户信息
  // - deleteUser(): 删除用户
  // - updateUserStatus(): 启用/禁用用户
  // - resetUserPassword(): 重置用户密码
  // - getUserRoles(): 获取用户角色
  // - assignUserRoles(): 分配用户角色
  // - getUserPermissions(): 获取用户权限
}
