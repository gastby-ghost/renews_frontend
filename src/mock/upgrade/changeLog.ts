import { ref } from 'vue'

/**
 * 升级日志项类型
 */
export interface UpgradeLogItem {
  version: string
  title: string
  requireReLogin: boolean
}

/**
 * 升级日志列表
 */
export const upgradeLogList = ref<UpgradeLogItem[]>([
  {
    version: '2.5.5',
    title: '系统架构优化与功能增强',
    requireReLogin: false
  }
])
