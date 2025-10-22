<template>
  <div class="login verify-email">
    <LoginLeftView></LoginLeftView>
    <div class="right-wrap">
      <div class="header">
        <ArtLogo class="icon" />
        <h1>{{ systemName }}</h1>
      </div>
      <div class="login-wrap">
        <div class="form">
          <h3 class="title">{{ $t('verifyEmail.title') }}</h3>

          <!-- 验证中状态 -->
          <div v-if="status === 'verifying'" class="verification-status">
            <ElIcon class="loading-icon" :size="48">
              <Loading />
            </ElIcon>
            <p class="status-text">{{ $t('verifyEmail.verifying') }}</p>
          </div>

          <!-- 验证成功状态 -->
          <div v-else-if="status === 'success'" class="verification-status success">
            <ElIcon class="status-icon" :size="48">
              <CircleCheck />
            </ElIcon>
            <h4 class="status-title">{{ $t('verifyEmail.success.title') }}</h4>
            <p class="status-message">{{ $t('verifyEmail.success.message') }}</p>
            <p class="redirect-text" v-if="countdown > 0">
              {{ $t('verifyEmail.success.redirectText', { seconds: countdown }) }}
            </p>
            <div class="action-buttons">
              <ElButton type="primary" @click="goToLogin">
                {{ $t('verifyEmail.buttons.login') }}
              </ElButton>
            </div>
          </div>

          <!-- 验证失败状态 -->
          <div v-else-if="status === 'error'" class="verification-status error">
            <ElIcon class="status-icon" :size="48">
              <CircleClose />
            </ElIcon>
            <h4 class="status-title">{{ $t('verifyEmail.error.title') }}</h4>
            <p class="status-message">{{ errorMessage || $t('verifyEmail.error.message') }}</p>
            <div class="action-buttons">
              <ElButton @click="resendVerification">
                {{ $t('verifyEmail.buttons.resend') }}
              </ElButton>
              <ElButton type="primary" @click="goToLogin">
                {{ $t('verifyEmail.buttons.login') }}
              </ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'
  import { RoutesAlias } from '@/router/routesAlias'
  import { ElMessage } from 'element-plus'
  import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
  import { useI18n } from 'vue-i18n'
  import { authService } from '@/services/authService'
  import { HttpError } from '@/utils/http/error'

  defineOptions({ name: 'VerifyEmail' })

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const systemName = AppConfig.systemInfo.name
  const status = ref<'verifying' | 'success' | 'error'>('verifying')
  const errorMessage = ref('')
  const countdown = ref(5)
  let countdownTimer: number | null = null

  // 验证邮件
  const verifyEmail = async () => {
    try {
      const token = route.query.token as string

      if (!token) {
        status.value = 'error'
        errorMessage.value = '缺少验证令牌'
        return
      }

      const response = await authService.verifyEmail(token)

      if (response.success) {
        status.value = 'success'
        startCountdown()
      } else {
        status.value = 'error'
        errorMessage.value = response.message || t('verifyEmail.error.message')
      }
    } catch (error) {
      status.value = 'error'

      if (error instanceof HttpError) {
        errorMessage.value = error.message || t('verifyEmail.error.message')
      } else {
        errorMessage.value = error instanceof Error ? error.message : t('verifyEmail.error.message')
        console.error('[VerifyEmail] Unexpected error:', error)
      }
    }
  }

  // 开始倒计时
  const startCountdown = () => {
    countdownTimer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
        goToLogin()
      }
    }, 1000)
  }

  // 跳转到登录页
  const goToLogin = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    router.push(RoutesAlias.Login)
  }

  // 重新发送验证邮件
  const resendVerification = async () => {
    try {
      // 这里可以根据实际需求实现重新发送验证邮件的逻辑
      // 可能需要用户提供邮箱地址，或者从令牌中解析邮箱

      ElMessage.info('重新发送验证邮件功能正在开发中')
    } catch {
      ElMessage.error('重新发送验证邮件失败，请稍后重试')
    }
  }

  onMounted(() => {
    verifyEmail()
  })

  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
  })
</script>

<style lang="scss" scoped>
  @use '../login/index' as login;

  .verify-email {
    .verification-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      text-align: center;

      .loading-icon {
        margin-bottom: 20px;
        color: var(--el-color-primary);
        animation: rotate 2s linear infinite;
      }

      .status-icon {
        margin-bottom: 20px;
      }

      .status-text {
        font-size: 16px;
        color: var(--art-gray-600);
      }

      .status-title {
        margin: 0 0 12px;
        font-size: 20px;
        font-weight: 600;
        color: var(--art-text-color);
      }

      .status-message {
        max-width: 400px;
        margin: 0 0 20px;
        font-size: 14px;
        line-height: 1.5;
        color: var(--art-gray-600);
      }

      .redirect-text {
        margin: 0 0 20px;
        font-size: 14px;
        color: var(--art-gray-500);
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
      }

      &.success {
        .status-icon {
          color: var(--el-color-success);
        }
      }

      &.error {
        .status-icon {
          color: var(--el-color-danger);
        }
      }
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
