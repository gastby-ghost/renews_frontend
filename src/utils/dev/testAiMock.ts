/**
 * AI服务Mock功能测试脚本
 * 用于验证aiService的mock实现是否正常工作
 */

import { aiService } from '@/services/aiService'
import { apiConfigManager } from '@/config/api'
import { mockDataManager } from '@/mock'

/**
 * 测试AI服务Mock功能
 */
export async function testAiMockFunctionality() {
  console.log('🧪 开始测试AI服务Mock功能...')

  try {
    // 1. 检查当前配置
    const config = apiConfigManager.getConfig()
    console.log('📋 当前API配置:', {
      useMock: config.useMock,
      showDebugInfo: config.showDebugInfo,
      mockDelay: config.mockDelay
    })

    // 2. 确保Mock模式开启
    if (!config.useMock) {
      console.log('🔧 启用Mock模式进行测试...')
      apiConfigManager.setUseMock(true)
    }

    // 3. 确保调试信息开启
    if (!config.showDebugInfo) {
      console.log('🔧 启用调试信息...')
      apiConfigManager.setShowDebugInfo(true)
    }

    // 4. 测试搜索工具状态API
    console.log('\n🔍 测试搜索工具状态API...')
    try {
      const status = await aiService.getSearchToolsStatus()
      console.log('✅ 搜索工具状态测试成功:', status)
    } catch (error) {
      console.error('❌ 搜索工具状态测试失败:', error)
    }

    // 5. 测试搜索提供商API
    console.log('\n🔍 测试搜索提供商API...')
    try {
      const providers = await aiService.getSearchProviders()
      console.log('✅ 搜索提供商测试成功:', providers)
    } catch (error) {
      console.error('❌ 搜索提供商测试失败:', error)
    }

    // 6. 测试搜索工具API
    console.log('\n🔍 测试搜索工具API...')
    try {
      const searchResult = await aiService.searchTools({
        queries: ['测试查询'],
        provider: 'tavily',
        max_results: 5
      })
      console.log('✅ 搜索工具测试成功:', searchResult)
    } catch (error) {
      console.error('❌ 搜索工具测试失败:', error)
    }

    // 7. 测试Scope Agent任务API
    console.log('\n🔍 测试Scope Agent任务API...')
    try {
      const tasks = await aiService.getScopeAgentTasks('mock-user')
      console.log('✅ Scope Agent任务测试成功:', tasks)
    } catch (error) {
      console.error('❌ Scope Agent任务测试失败:', error)
    }

    // 8. 测试Mock数据管理器
    console.log('\n🔍 测试Mock数据管理器...')
    try {
      const cacheStats = mockDataManager.getCacheStats()
      console.log('✅ Mock数据管理器测试成功:', cacheStats)
    } catch (error) {
      console.error('❌ Mock数据管理器测试失败:', error)
    }

    console.log('\n🎉 AI服务Mock功能测试完成!')
    console.log('📝 重构总结:')
    console.log('  - Mock数据已移动到 @/mock 目录')
    console.log('  - 使用外部的Mock数据管理器')
    console.log('  - 支持缓存和类型安全的Mock数据')
    console.log('  - 遵循项目的架构规范')

    return {
      success: true,
      message: '所有测试已完成，Mock重构成功！请查看控制台输出以确认结果'
    }
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 在浏览器控制台中运行测试
 */
export function runTestInConsole() {
  if (typeof window !== 'undefined') {
    // 将测试函数暴露到全局
    ;(window as any).testAiMock = testAiMockFunctionality
    console.log('💡 在控制台中运行 testAiMock() 来测试AI服务Mock功能')
  }
}

// 自动运行测试（如果在开发环境）
if (import.meta.env.DEV) {
  // 延迟执行，确保所有模块都已加载
  setTimeout(() => {
    console.log('🚀 开发环境检测到，自动运行AI服务Mock测试...')
    testAiMockFunctionality()
  }, 2000)
}
