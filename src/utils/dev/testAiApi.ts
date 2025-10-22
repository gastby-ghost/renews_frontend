/**
 * AI API测试工具
 * 用于验证AI API配置是否正确集成
 */

import { aiService } from '@/services/aiService'
import { apiConfigManager } from '@/config/api'

/**
 * 测试AI API配置
 */
export async function testAiApiIntegration() {
  console.log('🧪 开始测试AI API集成...')

  try {
    // 1. 验证API配置
    console.log('📋 检查API配置...')
    const config = apiConfigManager.getConfig()
    console.log('当前配置:', config)

    // 2. 验证AI服务配置
    console.log('🔧 检查AI服务配置...')
    const aiServiceConfig = apiConfigManager.getServiceConfig('ai')
    console.log('AI服务配置:', aiServiceConfig)

    // 3. 测试健康检查
    console.log('🏥 测试健康检查...')
    const health = await aiService.healthCheck()
    console.log('健康检查结果:', health)

    // 4. 测试搜索工具状态
    console.log('🔍 测试搜索工具状态...')
    const searchStatus = await aiService.getSearchToolsStatus()
    console.log('搜索工具状态:', searchStatus)

    // 5. 测试标题生成工具状态
    console.log('📝 测试标题生成工具状态...')
    const titleStatus = await aiService.getTitleToolsStatus()
    console.log('标题生成工具状态:', titleStatus)

    // 6. 测试大纲生成工具状态
    console.log('📑 测试大纲生成工具状态...')
    const outlineStatus = await aiService.getOutlineToolsStatus()
    console.log('大纲生成工具状态:', outlineStatus)

    // 7. 测试搜索提供商
    console.log('🏢 测试搜索提供商...')
    const providers = await aiService.getSearchProviders()
    console.log('搜索提供商:', providers)

    console.log('✅ AI API集成测试完成！')
    return true
  } catch (error) {
    console.error('❌ AI API集成测试失败:', error)
    return false
  }
}

/**
 * 测试AI文档生成功能
 */
export async function testAiDocumentGeneration() {
  console.log('📝 开始测试AI文档生成功能...')

  try {
    // 测试标题生成
    console.log('🎯 测试标题生成...')
    const titleRequest = {
      research_brief: '人工智能技术发展趋势分析',
      web_search_data: [
        {
          url: 'https://example.com/ai-trends',
          score: 0.95,
          query: 'AI技术发展趋势',
          title: '2024年AI技术发展趋势报告',
          summary: '详细介绍了2024年AI技术的最新发展方向'
        }
      ]
    }

    const titleResponse = await aiService.generateTitles(titleRequest)
    console.log('标题生成结果:', titleResponse)

    // 测试搜索工具
    console.log('🔍 测试搜索工具...')
    const searchRequest = {
      queries: ['人工智能技术', '机器学习应用'],
      provider: 'tavily' as const,
      max_results: 5
    }

    const searchResponse = await aiService.searchTools(searchRequest)
    console.log('搜索结果:', searchResponse)

    console.log('✅ AI文档生成功能测试完成！')
    return true
  } catch (error) {
    console.error('❌ AI文档生成功能测试失败:', error)
    return false
  }
}

/**
 * 测试AI Agent功能
 */
export async function testAiAgents() {
  console.log('🤖 开始测试AI Agent功能...')

  try {
    const userId = 'test_user'
    const projectId = 'test_project'

    // 测试Scope Agent
    console.log('🎯 测试Scope Agent...')
    const scopeRequest = {
      query: '人工智能在教育领域的应用前景'
    }

    const scopeResponse = await aiService.executeScopeAgent(userId, projectId, scopeRequest)
    console.log('Scope Agent响应:', scopeResponse)

    // 等待一段时间后检查状态
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const scopeStatus = await aiService.getScopeAgentStatus(scopeResponse.task_id)
    console.log('Scope Agent状态:', scopeStatus)

    // 测试Search Agent
    console.log('🔍 测试Search Agent...')
    const searchRequest = {
      brief: '人工智能在教育领域的应用研究',
      max_concurrent_research_units: 3
    }

    const searchResponse = await aiService.executeSearchAgent(userId, projectId, searchRequest)
    console.log('Search Agent响应:', searchResponse)

    // 等待一段时间后检查状态
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const searchStatus = await aiService.getSearchAgentStatus(
      searchResponse.task_id,
      userId,
      projectId
    )
    console.log('Search Agent状态:', searchStatus)

    console.log('✅ AI Agent功能测试完成！')
    return true
  } catch (error) {
    console.error('❌ AI Agent功能测试失败:', error)
    return false
  }
}

/**
 * 运行所有AI API测试
 */
export async function runAllAiTests() {
  console.log('🚀 开始运行所有AI API测试...')

  const results = await Promise.all([
    testAiApiIntegration(),
    testAiDocumentGeneration(),
    testAiAgents()
  ])

  const allPassed = results.every((result) => result)

  if (allPassed) {
    console.log('🎉 所有AI API测试通过！')
  } else {
    console.log('⚠️  部分AI API测试失败，请检查控制台输出')
  }

  return allPassed
}

// 导出测试工具
export const aiTestUtils = {
  testAiApiIntegration,
  testAiDocumentGeneration,
  testAiAgents,
  runAllAiTests
}

export default aiTestUtils
