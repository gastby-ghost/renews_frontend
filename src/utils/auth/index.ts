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
 * 检查令牌是否过期
 * @param token JWT令牌
 * @param bufferSeconds 缓冲时间（秒），默认30秒
 * @returns 是否过期
 */
export function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  try {
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

  // 如果用户角色包含admin，直接返回true
  if (userRoles.includes('admin')) {
    return true
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
