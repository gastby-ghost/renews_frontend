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
  // Vue 核心导入
  import { reactive, ref } from 'vue'

  // Vue Router
  import { useRouter } from 'vue-router'

  // Element Plus
  import { ElMessage, ElNotification } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  // Composables
  import { useI18n } from 'vue-i18n'

  // 工具函数
  import { HttpError } from '@/utils/http/error'

  // 配置和类型
  import AppConfig from '@/config'
  import { RoutesAlias } from '@/router/routesAlias'

  // 服务
  import { authService } from '@/services/core/authService'

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

  const validateUsername = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule[0]')))
    } else if (value.length < 3 || value.length > 20) {
      callback(new Error(t('register.rule[4]')))
    } else {
      callback()
    }
  }

  const validateEmail = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule[1]')))
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        callback(new Error(t('register.rule[6]')))
      } else {
        callback()
      }
    }
  }

  const validatePass = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule[2]')))
    } else if (value.length < 6) {
      callback(new Error(t('register.rule[5]')))
    } else {
      if (formData.confirm_password !== '') {
        formRef.value?.validateField('confirm_password')
      }
      callback()
    }
  }

  const validatePass2 = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (!value) {
      callback(new Error(t('register.rule[2]')))
    } else if (value !== formData.password) {
      callback(new Error(t('register.rule[3]')))
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
        validator: (_rule: unknown, value: boolean, callback: (error?: Error) => void) => {
          if (!value) {
            callback(new Error(t('register.rule[7]')))
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
      await formRef.value.validate()
      loading.value = true

      // 注册请求
      const { username, email, password, confirm_password } = formData

      const registerResponse = await authService.register(
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

      if (registerResponse.success) {
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
          router.push(RoutesAlias.Login)
        }, 2000)
      } else {
        throw new Error(registerResponse.message || '注册失败')
      }
    } catch (error) {
      // 处理 HttpError
      if (error instanceof HttpError) {
        ElMessage.error(error.message || '注册失败，请稍后重试')
      } else {
        // 处理非 HttpError
        ElMessage.error(error instanceof Error ? error.message : '注册失败，请稍后重试')
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
