/**
 * 认证工具函数
 * 提供令牌解析、验证、过期检查等功能
 */

/**
 * 解析JWT令牌
 * @param token JWT令牌
 * @returns 解析后的令牌数据
 */
export function parseToken(token: string): { [key: string]: any } {
  try {
    // JWT格式：header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('无效的JWT格式')
    }

    // 解析payload部分
    const payload = parts[1]
    // 补全base64编码（如果需要）
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    // 解码并解析JSON
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    throw new Error(`令牌解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 检查mock令牌是否过期
 * @param token Mock令牌
 * @param bufferSeconds 缓冲时间（秒），默认30秒
 * @returns 是否过期
 */
export function isMockTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  try {
    // mock token格式: mock-时间戳-随机字符串
    const parts = token.split('-')
    if (parts.length < 2 || parts[0] !== 'mock') {
      return true // 格式错误，认为过期
    }

    const timestamp = parseInt(parts[1])
    if (isNaN(timestamp)) {
      return true // 时间戳无效，认为过期
    }

    // 检查创建时间是否超过有效期（默认24小时）
    const creationTime = timestamp
    const currentTime = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    const bufferTime = bufferSeconds * 1000 // 转换为毫秒

    return currentTime - creationTime >= maxAge - bufferTime
  } catch (error) {
    console.warn('检查mock令牌过期状态失败:', error)
    return true
  }
}

/**
 * 检查令牌是否过期
 * @param token JWT令牌或Mock令牌
 * @param bufferSeconds 缓冲时间（秒），默认30秒
 * @returns 是否过期
 */
export function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  try {
    // 如果是mock token，使用特殊的过期检查逻辑
    if (token.startsWith('mock-')) {
      return isMockTokenExpired(token, bufferSeconds)
    }

    // JWT token的正常过期检查
    const tokenData = parseToken(token)

    // 如果没有过期时间，认为未过期
    if (!tokenData.exp) {
      return false
    }

    // 获取当前时间（秒）
    const currentTime = Math.floor(Date.now() / 1000)
    // 添加缓冲时间
    const expirationTime = tokenData.exp - bufferSeconds

    return currentTime >= expirationTime
  } catch (error) {
    // 如果解析失败，认为令牌无效
    console.warn('检查令牌过期状态失败:', error)
    return true
  }
}

/**
 * 检查用户是否已认证
 * @param token 访问令牌
 * @returns 是否已认证
 */
export function isAuthenticated(token: string): boolean {
  if (!token) {
    return false
  }

  return !isTokenExpired(token)
}

/**
 * 检查用户是否有特定权限
 * @param userRoles 用户角色列表
 * @param requiredRoles 需要的角色列表
 * @returns 是否有权限
 */
export function hasPermission(userRoles: string[], requiredRoles: string[]): boolean {
  if (!userRoles || !requiredRoles) {
    return false
  }

  // 检查是否有匹配的角色
  return requiredRoles.some((role) => userRoles.includes(role))
}

/**
 * 检查用户是否有特定按钮权限
 * @param userButtons 用户按钮权限列表
 * @param requiredButton 需要的按钮权限
 * @returns 是否有权限
 */
export function hasButtonPermission(userButtons: string[], requiredButton: string): boolean {
  if (!userButtons || !requiredButton) {
    return false
  }

  return userButtons.includes(requiredButton)
}

/**
 * 获取令牌剩余有效时间（秒）
 * @param token JWT令牌
 * @returns 剩余有效时间（秒），如果已过期返回0
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const tokenData = parseToken(token)

    if (!tokenData.exp) {
      return 0
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const remainingTime = tokenData.exp - currentTime

    return Math.max(0, remainingTime)
  } catch (error) {
    console.warn('获取令牌剩余时间失败:', error)
    return 0
  }
}

/**
 * 从令牌中提取用户ID
 * @param token JWT令牌
 * @returns 用户ID，如果提取失败返回null
 */
export function getUserIdFromToken(token: string): string | null {
  try {
    const tokenData = parseToken(token)
    return tokenData.sub || tokenData.user_id || tokenData.userId || null
  } catch (error) {
    console.warn('从令牌中提取用户ID失败:', error)
    return null
  }
}

/**
 * 从令牌中提取用户角色
 * @param token JWT令牌
 * @returns 用户角色列表，如果提取失败返回空数组
 */
export function getRolesFromToken(token: string): string[] {
  try {
    const tokenData = parseToken(token)
    const roles = tokenData.roles || tokenData.role || []

    // 确保返回数组
    return Array.isArray(roles) ? roles : [roles].filter(Boolean)
  } catch (error) {
    console.warn('从令牌中提取用户角色失败:', error)
    return []
  }
}

/**
 * 验证认证状态的完整性
 * 检查令牌、用户状态和会话信息的一致性
 * @param accessToken 访问令牌
 * @param isLogin 登录状态
 * @param userInfo 用户信息
 * @returns 是否通过验证
 */
export function validateAuthState(accessToken: string, isLogin: boolean, userInfo: any): boolean {
  console.log('[Auth] 验证认证状态完整性', {
    hasToken: !!accessToken,
    isLogin,
    hasUserInfo: !!userInfo
  })

  // 如果没有令牌，登录状态应该为false
  if (!accessToken) {
    console.log('[Auth] 没有令牌，认证状态无效')
    return false
  }

  // 如果令牌存在但已过期，认证状态无效
  if (isTokenExpired(accessToken)) {
    console.log('[Auth] 令牌已过期，认证状态无效')
    return false
  }

  // 如果令牌有效但登录状态为false，认证状态不一致
  if (!isLogin) {
    console.log('[Auth] 令牌有效但登录状态为false，认证状态不一致')
    return false
  }

  // 如果令牌和登录状态都有效，但没有用户信息，认证状态不完整
  if (!userInfo || Object.keys(userInfo).length === 0) {
    console.log('[Auth] 缺少用户信息，认证状态不完整')
    return false
  }

  console.log('[Auth] 认证状态验证通过')
  return true
}

/**
 * 从令牌中提取用户信息并验证
 * @param token JWT令牌
 * @returns 验证结果和用户信息
 */
export function extractAndValidateUserInfo(token: string): {
  valid: boolean
  userId?: string
  roles?: string[]
} {
  try {
    if (isTokenExpired(token)) {
      console.log('[Auth] 令牌已过期')
      return { valid: false }
    }

    const userId = getUserIdFromToken(token)
    const roles = getRolesFromToken(token)

    if (!userId) {
      console.log('[Auth] 无法从令牌中提取用户ID')
      return { valid: false }
    }

    console.log('[Auth] 从令牌中成功提取用户信息', { userId, roles })
    return { valid: true, userId, roles }
  } catch (error) {
    console.error('[Auth] 提取和验证用户信息失败:', error)
    return { valid: false }
  }
}
