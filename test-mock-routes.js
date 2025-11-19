// 测试 Mock 路由加载
async function testMockRoutes() {
  console.log('开始测试 Mock 路由...')

  try {
    // 模拟动态导入
    const mockRoutes = await import('./src/mock/data/document-generate/mock-routes.ts')
    console.log('Mock 路由模块加载成功')
    console.log('模块导出:', Object.keys(mockRoutes))

    // 测试 getMockHandler 函数
    const { getMockHandler, buildRouteKey } = mockRoutes

    if (typeof getMockHandler === 'function') {
      console.log('getMockHandler 函数存在')

      // 测试一些路由
      const testCases = [
        { method: 'POST', url: '/api/v1/ai/title-agent/generate' },
        { method: 'GET', url: '/api/v1/ai/title-agent/status' },
        { method: 'POST', url: 'http://localhost:8000/api/v1/ai/outline-agent/generate' },
        { method: 'GET', url: '/api/v1/core/projects/123/briefs' }
      ]

      testCases.forEach((testCase) => {
        console.log(`\n测试: ${testCase.method} ${testCase.url}`)
        const routeKey = buildRouteKey(testCase)
        console.log(`构建的键值: ${routeKey}`)
        const handler = getMockHandler(testCase)
        console.log(`结果: ${handler ? '找到处理器' : '未找到处理器'}`)
      })
    } else {
      console.error('错误: getMockHandler 不是函数')
    }
  } catch (error) {
    console.error('Mock 路由测试失败:', error)
    console.error('错误详情:', error.message)
  }
}

testMockRoutes()
