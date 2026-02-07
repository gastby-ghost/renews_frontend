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
          <h3 class="title">{{ $t('forgetPassword.title') }}</h3>
          <p class="sub-title">{{ $t('forgetPassword.subTitle') }}</p>
          <ElForm ref="formRef" :model="formData" :rules="rules" label-position="top">
            <ElFormItem prop="email">
              <ElInput
                :placeholder="$t('forgetPassword.placeholder')"
                v-model.trim="formData.email"
                type="email"
                autocomplete="off"
              />
            </ElFormItem>

            <div style="margin-top: 15px">
              <ElButton
                class="login-btn"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('forgetPassword.submitBtnText') }}
              </ElButton>
            </div>

            <div style="margin-top: 15px">
              <ElButton class="back-btn" plain @click="toLogin">
                {{ $t('forgetPassword.backBtnText') }}
              </ElButton>
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
  import { authService } from '@/services/core/authService'
  import { HttpError } from '@/utils/http/error'

  defineOptions({ name: 'ForgetPassword' })

  const { t } = useI18n()
  const router = useRouter()
  const formRef = ref<FormInstance>()

  const systemName = AppConfig.systemInfo.name
  const loading = ref(false)

  const formData = reactive({
    email: ''
  })

  const validateEmail = (rule: any, value: string, callback: any) => {
    if (!value) {
      callback(new Error(t('forgetPassword.placeholder')))
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        callback(new Error(t('register.rule[6]')))
      } else {
        callback()
      }
    }
  }

  const rules = reactive<FormRules>({
    email: [{ required: true, validator: validateEmail, trigger: 'blur' }]
  })

  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      loading.value = true

      // 忘记密码请求
      const { email } = formData

      const response = await authService.forgotPassword(
        {
          email,
          newpassword: '' // 这个字段在API中是必需的，但在忘记密码流程中通常由用户在邮件中设置
        },
        {
          // 禁用自动错误显示，因为我们将在catch块中处理
          showErrorMessage: false
        }
      )

      if (response.success) {
        // 请求成功，显示成功提示
        ElNotification({
          title: t('forgetPassword.success.title'),
          message: t('forgetPassword.success.message'),
          type: 'success',
          duration: 5000,
          showClose: true
        })

        // 延迟跳转到登录页
        setTimeout(() => {
          router.push(RoutesAlias.Login)
        }, 3000)
      } else {
        throw new Error(response.message || '请求失败')
      }
    } catch (error) {
      // 处理 HttpError
      if (error instanceof HttpError) {
        ElMessage.error(error.message || '请求失败，请稍后重试')
      } else {
        ElMessage.error(error instanceof Error ? error.message : '请求失败，请稍后重试')
      }
    } finally {
      loading.value = false
    }
  }

  const toLogin = () => {
    router.push(RoutesAlias.Login)
  }
</script>

<style lang="scss" scoped>
  @use '../login/index';
</style>
