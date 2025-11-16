/**
 * AI服务模块导出文件
 * 集中管理所有AI服务实例
 */

// 导入所有AI服务
import { contentGenerateService } from './contentGenerateService'
import { outlineGenerateService } from './outlineGenerateService'
import { titleGenerateService } from './titleGenerateService'
import { materialBindService } from './materialBindService'
import { outlineWithMaterialService } from './outlineWithMaterialService'
import { scopeAgentService } from './scopeAgentService'
import { searchToolsService } from './searchToolsService'
import { searchAgentService } from './searchAgentService'
import { search2titleAgentService } from './search2titleAgentService'

// 统一导出所有AI服务实例
export {
  contentGenerateService,
  outlineGenerateService,
  titleGenerateService,
  materialBindService,
  outlineWithMaterialService,
  scopeAgentService,
  searchToolsService,
  searchAgentService,
  search2titleAgentService
}

// AI服务集合对象
export const aiServices = {
  contentGenerate: contentGenerateService,
  outlineGenerate: outlineGenerateService,
  titleGenerate: titleGenerateService,
  materialBind: materialBindService,
  outlineWithMaterial: outlineWithMaterialService,
  scopeAgent: scopeAgentService,
  searchTools: searchToolsService,
  searchAgent: searchAgentService,
  search2titleAgent: search2titleAgentService
} as const

// AI服务类型定义
export type AiServiceName = keyof typeof aiServices

/**
 * 获取AI服务实例
 * @param serviceName 服务名称
 * @returns 对应的服务实例
 */
export function getAiService<T extends AiServiceName>(serviceName: T): (typeof aiServices)[T] {
  return aiServices[serviceName]
}

/**
 * 获取所有AI服务状态
 * @returns 所有服务的状态信息
 */
export async function getAllAiServiceStatus() {
  try {
    const statusPromises = [
      searchToolsService.getSearchToolsStatus(),
      titleGenerateService.getTitleToolsStatus(),
      outlineGenerateService.getOutlineToolsStatus()
    ]

    const [searchStatus, titleStatus, outlineStatus] = await Promise.allSettled(statusPromises)

    return {
      searchTools: searchStatus.status === 'fulfilled' ? searchStatus.value : null,
      titleGenerate: titleStatus.status === 'fulfilled' ? titleStatus.value : null,
      outlineGenerate: outlineStatus.status === 'fulfilled' ? outlineStatus.value : null,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('获取AI服务状态失败:', error)
    return {
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 重启所有AI服务（如果支持）
 * @returns 重启结果
 */
export async function restartAllAiServices() {
  console.log('AI服务重启功能暂未实现')
  return {
    success: false,
    message: 'AI服务重启功能暂未实现',
    timestamp: new Date().toISOString()
  }
}

export default aiServices
