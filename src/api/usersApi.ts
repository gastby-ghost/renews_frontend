import request from '@/utils/http'
import { AuthService } from './authApi'

export class UserService {
  // 登录 - 使用新的认证API
  static login(params: Api.Auth.UserLoginRequest) {
    return AuthService.login(params)
  }

  // 获取用户信息
  static getUserInfo() {
    return request.get<Api.User.UserInfo>({
      url: '/api/v1/core/user/profile'
    })
  }

  // 获取用户列表
  static getUserList(params: Api.Common.PaginatingSearchParams) {
    return request.get<Api.User.UserListData>({
      url: '/api/v1/admin/users',
      params
    })
  }

  // 创建用户
  static createUser(params: Api.Auth.UserRegisterRequest) {
    return request.post<Api.Auth.PendingRegistrationResponse>({
      url: '/api/v1/admin/users',
      data: params
    })
  }

  // 更新用户信息
  static updateUser(userId: number, params: Partial<Api.User.UserInfo>) {
    return request.put<Api.User.UserInfo>({
      url: `/api/v1/admin/users/${userId}`,
      data: params
    })
  }

  // 删除用户
  static deleteUser(userId: number) {
    return request.del<null>({
      url: `/api/v1/admin/users/${userId}`
    })
  }

  // 启用/禁用用户
  static updateUserStatus(userId: number, status: Api.Common.EnableStatus) {
    return request.put<Api.User.UserInfo>({
      url: `/api/v1/admin/users/${userId}/status`,
      data: { status }
    })
  }

  // 重置用户密码
  static resetUserPassword(userId: number, newPassword: string) {
    return request.post<Api.Auth.ForgotPasswordResponse>({
      url: `/api/v1/admin/users/${userId}/reset-password`,
      data: { new_password: newPassword }
    })
  }

  // 获取用户角色
  static getUserRoles(userId: number) {
    return request.get<string[]>({
      url: `/api/v1/admin/users/${userId}/roles`
    })
  }

  // 分配用户角色
  static assignUserRoles(userId: number, roles: string[]) {
    return request.put<string[]>({
      url: `/api/v1/admin/users/${userId}/roles`,
      data: { roles }
    })
  }

  // 获取用户权限
  static getUserPermissions(userId: number) {
    return request.get<string[]>({
      url: `/api/v1/admin/users/${userId}/permissions`
    })
  }
}
