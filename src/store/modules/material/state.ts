/**
 * 素材状态定义
 * Material State Definition
 */

export interface MaterialState {
  materials: any[] // 素材列表
  selectedMaterials: string[] // 已选中的素材ID列表
  searchHistory: string[] // 搜索历史记录
  providers: any[] // 搜索提供商配置
  loading: boolean // 加载状态
  error: string | null // 错误信息
}

export const initialState: MaterialState = {
  materials: [],
  selectedMaterials: [],
  searchHistory: [],
  providers: [],
  loading: false,
  error: null
}
