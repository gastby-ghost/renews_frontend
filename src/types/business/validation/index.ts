/**
 * 验证错误类型定义
 * Validation Error Types
 */

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}
