import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError } from './error'
import { $t } from '@/locales'
import { isTokenExpired } from '@/utils/auth'
import { apiLogger } from '@/utils/apiLogger'
import * as Api from '@/types/api'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 2
const RETRY_DELAY = 1000
const UNAUTHORIZED_DEBOUNCE_TIME = 3000

/** 认证API路径配置 - 基于OpenAPI规范 */
const AUTH_API_PATTERNS = [
  '/api/v1/ai/', // AI服务使用success字段格式
  '/api/v1/core/login',
  '/api/v1/core/register',
  '/api/v1/core/forgot-password',
  '/api/v1/core/verify',
  '/api/v1/core/refresh-token'
]

/** 401防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: NodeJS.Timeout | null = null

/** 令牌刷新状态 */
let isRefreshingToken = false
let refreshSubscribers: Array<(token: string) => void> = []

/** 扩展 AxiosRequestConfig */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  _retry?: boolean // 标记是否已重试
}

const { VITE_API_URL, VITE_WITH_CREDENTIALS } = import.meta.env

/** Axios实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: VITE_API_URL,
  withCredentials: VITE_WITH_CREDENTIALS === 'true',
  validateStatus: (status) => status >= 200 && status < 300,
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

/** 请求拦截器 */
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { accessToken, initializeAuthState } = useUserStore()

    // 记录请求开始时间，用于计算耗时
    ;(request as any).startTime = Date.now()

    // 统一记录API请求开始
    apiLogger.request({
      url: request.url,
      method: request.method?.toUpperCase(),
      metadata: {
        hasData: !!request.data,
        contentType: request.headers['Content-Type']
      }
    })

    if (accessToken) {
      // 在发送请求前验证令牌是否仍然有效
      if (isTokenExpired(accessToken)) {
        console.log('[HTTP Request] 检测到令牌已过期，尝试刷新令牌')
        // 令牌已过期，尝试刷新令牌
        useUserStore()
          .refreshAccessToken()
          .then((success: boolean) => {
            if (!success) {
              console.log('[HTTP Request] 令牌刷新失败，重新初始化认证状态')
              initializeAuthState()
            }
          })
      }

      // 使用Bearer token格式
      request.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
      request.headers.set('Content-Type', 'application/json')
      request.data = JSON.stringify(request.data)
    }

    return request
  },
  (error) => {
    console.log('[HTTP Request] 请求配置错误:', error)
    showError(createHttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

/** 响应拦截器 - 基于OpenAPI规范优化 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<Api.Http.BaseResponse | Api.Ai.BaseResponse | any>) => {
    // 计算请求耗时
    const startTime = (response.config as any).startTime || Date.now()
    const duration = Date.now() - startTime

    // 统一记录API请求成功
    apiLogger.success({
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      status: response.status,
      duration,
      metadata: {
        responseSize: JSON.stringify(response.data).length
      }
    })

    // 检查是否是认证相关的API，这些API可能有不同的响应格式
    const isAuthAPI = AUTH_API_PATTERNS.some((pattern) => response.config.url?.includes(pattern))

    // AI服务响应处理 (基于ai_openapi.json)
    if (response.config.url?.includes('/api/v1/ai/')) {
      const aiResponse = response.data as Api.Ai.BaseResponse

      if (aiResponse && 'success' in aiResponse) {
        if (aiResponse.success === true) {
          return response
        } else {
          const errorMessage = aiResponse.message || aiResponse.error || $t('httpMsg.requestFailed')
          throw createHttpError(errorMessage, ApiStatus.error)
        }
      }
    }

    // 认证API响应处理 (基于core_openapi.json)
    if (isAuthAPI && response.config.url?.includes('/api/v1/core/')) {
      const authResponse = response.data as Api.Auth.AuthResponse

      if (authResponse && 'success' in authResponse) {
        if (authResponse.success === true) {
          return response
        } else {
          const errorMessage = authResponse.message || $t('httpMsg.requestFailed')
          throw createHttpError(errorMessage, ApiStatus.error)
        }
      }
    }

    // 标准API响应处理 (基于core_openapi.json)
    const standardResponse = response.data as Api.Http.BaseResponse
    if (standardResponse && 'code' in standardResponse) {
      const { code, msg } = standardResponse

      if (code === ApiStatus.success) {
        return response
      }

      if (code === ApiStatus.unauthorized) {
        handleUnauthorizedError(msg)
      }

      // 获取响应数据中的detail字段作为具体错误信息
      const detailMessage = (response.data as any)?.detail
      const errorMessage = detailMessage || msg || $t('httpMsg.requestFailed')
      throw createHttpError(errorMessage, code)
    }

    // 无标准结构的数据直接返回
    return response
  },
  async (error) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig
    const requestUrl = error.config?.url || ''

    // 计算请求耗时
    const startTime = (originalRequest as any).startTime || Date.now()
    const duration = Date.now() - startTime

    // 统一记录API请求错误
    apiLogger.error({
      url: originalRequest.url,
      method: originalRequest.method?.toUpperCase(),
      status: error.response?.status,
      duration,
      error,
      metadata: {
        message: error.message
      }
    })

    // 处理401错误和令牌刷新
    if (error.response?.status === ApiStatus.unauthorized && !originalRequest._retry) {
      return handleTokenRefreshError(originalRequest)
    }

    // AI服务特定错误处理 (基于ai_openapi.json)
    if (requestUrl.includes('/api/v1/ai/')) {
      const aiErrorData = error.response?.data
      let errorMessage = 'AI服务请求失败'
      let errorCode = ApiStatus.error

      if (aiErrorData) {
        if ('message' in aiErrorData) {
          errorMessage = aiErrorData.message
        } else if ('error' in aiErrorData) {
          errorMessage = aiErrorData.error
        } else if ('detail' in aiErrorData) {
          // 处理验证错误
          if (Array.isArray(aiErrorData.detail)) {
            errorMessage = aiErrorData.detail.map((item: any) => item.msg).join(', ')
          } else {
            errorMessage = aiErrorData.detail
          }
        }
        errorCode = error.response?.status || ApiStatus.error
      }

      return Promise.reject(createHttpError(errorMessage, errorCode))
    }

    // 认证API错误处理 (基于core_openapi.json)
    if (
      AUTH_API_PATTERNS.some(
        (pattern) => requestUrl.includes(pattern) && requestUrl.includes('/api/v1/core/')
      )
    ) {
      const authErrorData = error.response?.data
      let errorMessage = '认证服务请求失败'
      let errorCode = ApiStatus.error

      if (authErrorData) {
        if ('message' in authErrorData) {
          errorMessage = authErrorData.message
        } else if ('detail' in authErrorData) {
          if (Array.isArray(authErrorData.detail)) {
            errorMessage = authErrorData.detail.map((item: any) => item.msg).join(', ')
          } else {
            errorMessage = authErrorData.detail
          }
        }
        errorCode = error.response?.status || ApiStatus.error
      }

      return Promise.reject(createHttpError(errorMessage, errorCode))
    }

    return Promise.reject(handleError(error))
  }
)

/** 统一创建HttpError */
function createHttpError(message: string, code: number) {
  return new HttpError(message, code)
}

/** 处理令牌刷新错误 */
async function handleTokenRefreshError(originalRequest: ExtendedAxiosRequestConfig) {
  const userStore = useUserStore()

  // 如果正在刷新令牌，将请求加入队列
  if (isRefreshingToken) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token: string) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        resolve(request(originalRequest))
      })
    })
  }

  // 标记正在刷新令牌
  isRefreshingToken = true
  originalRequest._retry = true

  try {
    // 尝试刷新令牌
    const refreshSuccess = await userStore.refreshAccessToken()

    if (refreshSuccess) {
      // 刷新成功，更新所有队列中的请求
      const { accessToken } = userStore
      refreshSubscribers.forEach((callback) => callback(accessToken))
      refreshSubscribers = []

      // 重试原始请求
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
      }
      return request(originalRequest)
    } else {
      // 刷新失败，执行降级处理
      handleRefreshFailure()
      throw createHttpError($t('httpMsg.tokenRefreshFailed'), ApiStatus.unauthorized)
    }
  } catch (error) {
    // 刷新过程中出错，执行降级处理
    handleRefreshFailure()
    throw error
  } finally {
    isRefreshingToken = false
  }
}

/** 处理刷新失败的降级处理 */
function handleRefreshFailure() {
  const userStore = useUserStore()

  // 清空令牌
  userStore.setToken('', '')

  // 显示错误消息
  showError(createHttpError($t('httpMsg.sessionExpired'), ApiStatus.unauthorized), true)

  // 延迟登出，给用户时间看到错误消息
  setTimeout(() => {
    userStore.logOut()
  }, LOGOUT_DELAY)
}

/** 处理401错误（带防抖） */
function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()

    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)

    showError(error, true)
    throw error
  }

  throw error
}

/** 重置401防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/** 是否需要重试 */
function shouldRetry(statusCode: number) {
  return [
    ApiStatus.requestTimeout,
    ApiStatus.internalServerError,
    ApiStatus.badGateway,
    ApiStatus.serviceUnavailable,
    ApiStatus.gatewayTimeout
  ].includes(statusCode)
}

/** 请求重试逻辑 */
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    if (retries > 0 && error instanceof HttpError && shouldRetry(error.code)) {
      await delay(RETRY_DELAY)
      return retryRequest<T>(config, retries - 1)
    }
    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 请求函数 - 基于OpenAPI规范优化 */
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  // POST | PUT 参数自动填充
  if (
    ['POST', 'PUT'].includes(config.method?.toUpperCase() || '') &&
    config.params &&
    !config.data
  ) {
    config.data = config.params
    config.params = undefined
  }

  try {
    const res = await axiosInstance.request<Api.Http.BaseResponse<T> | Api.Ai.BaseResponse | any>(
      config
    )

    // 基于OpenAPI规范的响应处理
    const responseData = res.data
    const url = config.url || ''

    // AI服务响应处理 (基于ai_openapi.json)
    if (url.includes('/api/v1/ai/')) {
      const aiResponse = responseData as Api.Ai.BaseResponse
      if (aiResponse && 'success' in aiResponse) {
        if (aiResponse.success) {
          // 对于AI服务，返回整个响应数据
          return responseData as T
        } else {
          throw createHttpError(
            aiResponse.message || aiResponse.error || 'AI服务请求失败',
            ApiStatus.error
          )
        }
      }
    }

    // 认证API响应处理 (基于core_openapi.json)
    if (
      AUTH_API_PATTERNS.some((pattern) => url.includes(pattern) && url.includes('/api/v1/core/'))
    ) {
      const authResponse = responseData as Api.Auth.AuthResponse
      if (authResponse && 'success' in authResponse) {
        if (authResponse.success) {
          return responseData as T
        } else {
          throw createHttpError(authResponse.message || '认证服务请求失败', ApiStatus.error)
        }
      }
    }

    // 标准API响应处理 (基于core_openapi.json)
    const standardResponse = responseData as Api.Http.BaseResponse<T>
    if (standardResponse && 'code' in standardResponse && 'data' in standardResponse) {
      if (standardResponse.code === ApiStatus.success) {
        return standardResponse.data
      } else {
        throw createHttpError(standardResponse.msg || '请求失败', standardResponse.code)
      }
    }

    // 无标准结构的响应直接返回
    return responseData as T
  } catch (error) {
    if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      const showMsg = config.showErrorMessage !== false
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/** API方法集合 */
const api = {
  get<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  del<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  request<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>(config)
  }
}

export default api
