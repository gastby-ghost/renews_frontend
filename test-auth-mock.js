#!/usr/bin/env node

/**
 * 测试AuthService的Mock登录功能
 */

import { authService } from './src/services/core/authService'

async function testAuthLogin() {
  console.log('=== 开始测试AuthService Mock登录 ===')

  try {
    console.log('1. 调用authService.login()...')

    const loginParams = {
      login: 'test@example.com',
      password: 'password123',
      remember_me: false
    }

    console.log('2. 登录参数:', loginParams)

    const result = await authService.login(loginParams)

    console.log('3. 登录成功! 结果:', result)
    console.log('4. 结果类型:', typeof result)
    console.log('5. 结果字段:', Object.keys(result || {}))

    if (result && result.success) {
      console.log('✅ Mock登录测试成功!')
      console.log('Token:', result.token?.substring(0, 20) + '...')
      console.log('User:', result.user?.username)
    } else {
      console.log('❌ Mock登录测试失败: 结果格式不正确')
    }
  } catch (error) {
    console.error('❌ Mock登录测试失败:', error)
    console.error('错误类型:', typeof error)
    console.error('错误详情:', error.message)
  }

  console.log('=== 测试结束 ===')
}

// 运行测试
testAuthLogin()
