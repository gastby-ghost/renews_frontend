<template>
  <div class="login register">
    <LoginLeftView></LoginLeftView>
    <div class="right-wrap">
      <div class="header">
        <ArtLogo class="icon" />
        <h1>{{ systemName }}</h1>
      </div>
      <div class="login-wrap">
        <div class="form">
          <h3 class="title">{{ $t('register.title') }}</h3>
          <p class="sub-title">{{ $t('register.subTitle') }}</p>
          <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top">
            <ElFormItem prop="username">
              <ElInput
                v-model.trim="formData.username"
                :placeholder="$t('register.placeholder[0]')"
              />
            </ElFormItem>

            <ElFormItem prop="email">
              <ElInput
                v-model.trim="formData.email"
                :placeholder="$t('register.placeholder[1]')"
                type="email"
                autocomplete="off"
              />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                v-model.trim="formData.password"
                :placeholder="$t('register.placeholder[2]')"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="confirm_password">
              <ElInput
                v-model.trim="formData.confirm_password"
                :placeholder="$t('register.placeholder[3]')"
                type="password"
                autocomplete="off"
                @keyup.enter="register"
                show-password
              />
            </ElFormItem>

            <ElFormItem prop="agree_to_terms">
              <ElCheckbox v-model="formData.agree_to_terms">
                {{ $t('register.agreeText') }}
                <router-link
                  style="color: var(--main-color); text-decoration: none"
                  to="/terms-of-service"
                  >{{ $t('register.termsOfService') }}</router-link
                >
                {{ $t('common.and') }}
                <router-link
                  style="color: var(--main-color); text-decoration: none"
                  to="/privacy-policy"
                  >{{ $t('register.privacyPolicy') }}</router-link
                >
              </ElCheckbox>
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="register-btn"
                type="primary"
                @click="register"
                :loading="loading"
                v-ripple
              >
                {{ $t('register.submitBtnText') }}
              </ElButton>
            </div>

            <div class="footer">
              <p>
                {{ $t('register.hasAccount') }}
                <router-link :to="RoutesAlias.Login">{{ $t('register.toLogin') }}</router-link>
              </p>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { RoutesAlias } from '@/router/routesAlias'
  import { ElMessage, ElNotification } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { AuthService } from '@/api/authApi'
  import { HttpError } from '@/utils/http/error'

  defineOptions({ name: 'Register' })

  const { t } = useI18n()

  const router = useRouter()
  const formRef = ref<FormInstance>()

  const systemName = AppConfig.systemInfo.name
  const loading = ref(false)

  const formData = reactive({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    agree_to_terms: false
  })

  const validateUsername = (rule: any, value: string, callback: any) => {
    console.log('[Register] 验证用户名:', value)
    if (!value) {
      const errorMsg = t('register.rule[0]')
      console.log('[Register] 用户名空错误信息:', errorMsg)
      callback(new Error(errorMsg))
    } else if (value.length < 3 || value.length > 20) {
      const errorMsg = t('register.rule[4]')
      console.log('[Register] 用户名长度错误信息:', errorMsg)
      callback(new Error(errorMsg))
    } else {
      callback()
    }
  }

  const validateEmail = (rule: any, value: string, callback: any) => {
    console.log('[Register] 验证邮箱:', value)
    if (!value) {
      const errorMsg = t('register.rule[1]')
      console.log('[Register] 邮箱空错误信息:', errorMsg)
      callback(new Error(errorMsg))
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        const errorMsg = t('register.rule[6]')
        console.log('[Register] 邮箱格式错误信息:', errorMsg)
        callback(new Error(errorMsg))
      } else {
        callback()
      }
    }
  }

  const validatePass = (rule: any, value: string, callback: any) => {
    console.log('[Register] 验证密码:', value ? '***' : '')
    if (!value) {
      const errorMsg = t('register.rule[2]')
      console.log('[Register] 密码空错误信息:', errorMsg)
      callback(new Error(errorMsg))
    } else if (value.length < 6) {
      const errorMsg = t('register.rule[5]')
      console.log('[Register] 密码长度错误信息:', errorMsg)
      callback(new Error(errorMsg))
    } else {
      if (formData.confirm_password !== '') {
        formRef.value?.validateField('confirm_password')
      }
      callback()
    }
  }

  const validatePass2 = (rule: any, value: string, callback: any) => {
    console.log('[Register] 验证确认密码:', value ? '***' : '')
    if (!value) {
      const errorMsg = t('register.rule[2]')
      console.log('[Register] 确认密码空错误信息:', errorMsg)
      callback(new Error(errorMsg))
    } else if (value !== formData.password) {
      const errorMsg = t('register.rule[3]')
      console.log('[Register] 密码不匹配错误信息:', errorMsg)
      callback(new Error(errorMsg))
    } else {
      callback()
    }
  }

  const rules = reactive<FormRules>({
    username: [{ required: true, validator: validateUsername, trigger: 'blur' }],
    email: [{ required: true, validator: validateEmail, trigger: 'blur' }],
    password: [{ required: true, validator: validatePass, trigger: 'blur' }],
    confirm_password: [{ required: true, validator: validatePass2, trigger: 'blur' }],
    agree_to_terms: [
      {
        validator: (rule: any, value: boolean, callback: any) => {
          console.log('[Register] 验证服务条款同意:', value)
          if (!value) {
            const errorMsg = t('register.rule[7]')
            console.log('[Register] 服务条款未同意错误信息:', errorMsg)
            callback(new Error(errorMsg))
          } else {
            callback()
          }
        },
        trigger: 'change'
      }
    ]
  })

  const register = async () => {
    if (!formRef.value) return

    try {
      console.log('[Register] 开始表单验证')
      await formRef.value.validate()
      console.log('[Register] 表单验证通过')
      loading.value = true

      // 注册请求
      const { username, email, password, confirm_password } = formData
      console.log('[Register] 准备发送注册请求:', {
        username,
        email,
        password: '***',
        confirm_password: '***',
        agree_to_terms: formData.agree_to_terms
      })

      const registerResponse = await AuthService.register(
        {
          username,
          email,
          password,
          confirm_password,
          agree_to_terms: formData.agree_to_terms
        },
        {
          // 禁用自动错误显示，因为我们将在catch块中处理
          showErrorMessage: false
        }
      )

      console.log('[Register] 收到注册响应:', registerResponse)

      if (registerResponse.success) {
        console.log('[Register] 注册成功，准备显示成功提示')
        // 注册成功，显示成功提示
        ElNotification({
          title: t('register.success.title'),
          message: t('register.success.message'),
          type: 'success',
          duration: 5000,
          showClose: true
        })

        // 延迟跳转到登录页
        setTimeout(() => {
          console.log('[Register] 准备跳转到登录页')
          router.push(RoutesAlias.Login)
        }, 2000)
      } else {
        console.log('[Register] 注册失败，响应:', registerResponse)
        throw new Error(registerResponse.message || '注册失败')
      }
    } catch (error) {
      console.log('[Register] 捕获到错误:', error)
      // 处理 HttpError
      if (error instanceof HttpError) {
        console.log('[Register] HttpError:', error.message, error.code)
        ElMessage.error(error.message || '注册失败，请稍后重试')
      } else {
        // 处理非 HttpError
        console.log('[Register] 非HttpError:', error)
        ElMessage.error(error instanceof Error ? error.message : '注册失败，请稍后重试')
        console.error('[Register] Unexpected error:', error)
      }
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  @use '../login/index' as login;
  @use './index' as register;
</style>
