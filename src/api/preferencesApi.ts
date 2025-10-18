import request from '@/utils/http'

export class PreferencesService {
  // 获取用户偏好设置
  static getUserPreferences() {
    return request.get<Api.Preferences.UserPreference>({
      url: '/api/v1/core/preferences/'
    })
  }

  // 更新用户偏好设置
  static updateUserPreferences(params: Api.Preferences.UpdateUserPreferenceRequest) {
    return request.put<Api.Preferences.UserPreferenceResponse>({
      url: '/api/v1/core/preferences/',
      data: params
    })
  }

  // 获取默认偏好设置
  static getDefaultPreferences() {
    return request.get<Api.Preferences.DefaultPreferencesResponse>({
      url: '/api/v1/core/preferences/default'
    })
  }

  // 删除用户偏好设置
  static deleteUserPreference() {
    return request.del<null>({
      url: '/api/v1/core/preferences/'
    })
  }

  // 重置用户偏好设置
  static resetUserPreferences(resetType: string = 'all') {
    return request.post<Api.Preferences.UserPreferenceResponse>({
      url: '/api/v1/core/preferences/reset',
      data: { reset_type: resetType }
    })
  }

  // 导出用户偏好设置
  static exportUserPreferences(format: string = 'json') {
    return request.post<{ export_data: string; format: string }>({
      url: '/api/v1/core/preferences/export',
      data: { format }
    })
  }

  // 导入用户偏好设置
  static importUserPreferences(
    importData: string,
    format: string = 'json',
    overwrite: boolean = false
  ) {
    return request.post<Api.Preferences.UserPreference>({
      url: '/api/v1/core/preferences/import',
      data: {
        import_data: importData,
        format,
        overwrite
      }
    })
  }

  // 获取可用主题列表
  static getAvailableThemes() {
    return request.get<string[]>({
      url: '/api/v1/core/preferences/themes'
    })
  }

  // 获取可用字体大小列表
  static getAvailableFontSizes() {
    return request.get<string[]>({
      url: '/api/v1/core/preferences/font-sizes'
    })
  }

  // 获取可用自动保存频率列表
  static getAvailableAutoSaveFrequencies() {
    return request.get<string[]>({
      url: '/api/v1/core/preferences/auto-save-frequencies'
    })
  }

  // 获取可用语言列表
  static getAvailableLanguages() {
    return request.get<string[]>({
      url: '/api/v1/core/preferences/languages'
    })
  }

  // 获取可用时区列表
  static getAvailableTimezones() {
    return request.get<string[]>({
      url: '/api/v1/core/preferences/timezones'
    })
  }
}
