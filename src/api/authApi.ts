import request from '@/utils/http'

export class AuthService {
  // 用户注册
  static register(params: Api.Auth.UserRegisterRequest, options?: { showErrorMessage?: boolean }) {
    return request.post<Api.Auth.PendingRegistrationResponse>({
      url: '/api/v1/core/register',
      data: params,
      showErrorMessage: options?.showErrorMessage
    })
  }

  // 用户登录
  static login(params: Api.Auth.UserLoginRequest, options?: { showErrorMessage?: boolean }) {
    return request.post<Api.Auth.AuthResponse>({
      url: '/api/v1/core/login',
      data: params,
      showErrorMessage: options?.showErrorMessage
    })
  }

  // 刷新访问令牌
  static refreshToken(refreshToken: string) {
    return request.post<Api.Auth.RefreshTokenResponse>({
      url: '/api/v1/core/refresh-token',
      params: { refresh_token: refreshToken }
    })
  }

  // 用户登出
  static logout() {
    return request.post<null>({
      url: '/api/v1/core/logout'
    })
  }

  // 忘记密码
  static forgotPassword(
    params: Api.Auth.ForgotPasswordRequest,
    options?: { showErrorMessage?: boolean }
  ) {
    return request.post<Api.Auth.ForgotPasswordResponse>({
      url: '/api/v1/core/forgot-password',
      data: params,
      showErrorMessage: options?.showErrorMessage
    })
  }

  // 邮件验证
  static verifyEmail(token: string) {
    return request.get<Api.Auth.VerificationResponse>({
      url: `/api/v1/core/verify/${token}`
    })
  }

  // 获取账户设置
  static getAccountSettings() {
    return request.get<Api.Auth.AccountSettingsResponse>({
      url: '/api/v1/core/account'
    })
  }

  // 注销账户
  static deleteAccount(params: Api.Auth.DeleteAccountRequest) {
    return request.del<null>({
      url: '/api/v1/core/account',
      data: params
    })
  }
}
