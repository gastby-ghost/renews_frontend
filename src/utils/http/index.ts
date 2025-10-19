import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError } from './error'
import { $t } from '@/locales'
import { isTokenExpired } from '@/utils/auth'

/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 2
const RETRY_DELAY = 1000
const UNAUTHORIZED_DEBOUNCE_TIME = 3000

/** 认证API路径配置 */
const AUTH_API_PATTERNS = [
  '/api/v1/core/',
  '/api/v1/ai/'
  // 未来可以轻松添加更多路径
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
    console.log('[HTTP Request] 发送请求:', {
      url: request.url,
      method: request.method,
      data: request.data,
      headers: request.headers
    })
    const { accessToken, initializeAuthState } = useUserStore()

    if (accessToken) {
      // 在发送请求前验证令牌是否仍然有效
      if (isTokenExpired(accessToken)) {
        console.log('[HTTP Request] 检测到令牌已过期，尝试刷新令牌')
        // 令牌已过期，尝试刷新令牌
        useUserStore()
          .refreshAccessToken()
          .then((success) => {
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

/** 响应拦截器 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<Api.Http.BaseResponse>) => {
    console.log('[HTTP Response] 成功响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })

    // 检查是否是认证相关的API，这些API可能有不同的响应格式
    const isAuthAPI = AUTH_API_PATTERNS.some((pattern) => response.config.url?.includes(pattern))
    console.log('[HTTP Response] 检查API类型:', { url: response.config.url, isAuthAPI })

    // 添加更详细的响应数据结构日志
    console.log('[HTTP Response] 响应数据结构分析:', {
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      hasCode: response.data && 'code' in response.data,
      hasSuccess: response.data && 'success' in response.data,
      codeValue: response.data?.code,
      successValue: (response.data as any)?.success
    })

    if (isAuthAPI) {
      // 认证API的特殊处理
      const responseData = response.data as any
      console.log('[HTTP Response] 认证API响应数据:', responseData)

      // 检查是否是AuthResponse格式 (success字段而不是code字段)
      if (Object.prototype.hasOwnProperty.call(responseData, 'success')) {
        console.log('[HTTP Response] 检测到AuthResponse格式，success值:', responseData.success)

        // 如果success为true，直接返回响应
        if (responseData.success === true) {
          console.log('[HTTP Response] AuthResponse成功，返回响应')
          return response
        } else {
          // 如果success为false，抛出错误
          const errorMessage =
            responseData.message || responseData.msg || $t('httpMsg.requestFailed')
          console.log('[HTTP Response] AuthResponse失败，错误信息:', errorMessage)
          throw createHttpError(errorMessage, ApiStatus.error)
        }
      }
    }

    // 标准API响应处理
    const { code, msg } = response.data
    console.log('[HTTP Response] 标准API处理:', { code, msg, expectedCode: ApiStatus.success })

    // 处理没有code和msg字段的响应（直接返回数据）
    if (code === undefined && msg === undefined) {
      console.log('[HTTP Response] 检测到无code/msg字段的响应，直接返回数据')
      return response
    }

    if (code === ApiStatus.success) {
      console.log('[HTTP Response] 标准API成功，返回响应')
      return response
    }

    if (code === ApiStatus.unauthorized) {
      console.log('[HTTP Response] 处理未授权错误')
      handleUnauthorizedError(msg)
    }

    // 获取响应数据中的detail字段作为具体错误信息
    const responseData = response.data as any
    const detailMessage = responseData?.detail

    // 优先使用detail字段，其次使用msg字段
    const errorMessage = detailMessage || msg || $t('httpMsg.requestFailed')
    console.log('[HTTP Response] 标准API错误处理:', { errorMessage, code, detailMessage, msg })
    throw createHttpError(errorMessage, code)
  },
  async (error) => {
    console.log('[HTTP Response] 错误响应:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })

    const originalRequest = error.config as ExtendedAxiosRequestConfig

    // 处理401错误和令牌刷新
    if (error.response?.status === ApiStatus.unauthorized && !originalRequest._retry) {
      return handleTokenRefreshError(originalRequest)
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

/** 请求函数 */
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
    const res = await axiosInstance.request<Api.Http.BaseResponse<T>>(config)

    // 检查是否是认证相关的API，这些API可能有不同的响应格式
    const isAuthAPI = AUTH_API_PATTERNS.some((pattern) => config.url?.includes(pattern))
    console.log('[Request] 检查API类型:', { url: config.url, isAuthAPI })

    // 检查响应数据结构
    const responseData = res.data as any
    const hasCodeField = responseData && 'code' in responseData
    const hasDataField = responseData && 'data' in responseData
    const hasSuccessField = responseData && 'success' in responseData

    console.log('[Request] 响应数据结构分析:', {
      hasCodeField,
      hasDataField,
      hasSuccessField,
      isAuthAPI
    })

    if (isAuthAPI) {
      // 认证API的特殊处理，直接返回整个响应数据
      console.log('[Request] 认证API，返回完整响应数据:', res.data)
      return res.data as T
    } else if (hasCodeField && hasDataField) {
      // 标准API响应处理，返回data字段
      console.log('[Request] 标准API，返回data字段:', res.data.data)
      return res.data.data as T
    } else {
      // 没有标准结构，直接返回响应数据
      console.log('[Request] 非标准API响应，直接返回响应数据:', res.data)
      return res.data as T
    }
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
