<template>
  <div class="login">
    <LoginLeftView></LoginLeftView>

    <div class="right-wrap">
      <div class="top-right-wrap">
        <div class="btn theme-btn" @click="themeAnimation">
          <i class="iconfont-sys">
            {{ isDark ? '&#xe6b5;' : '&#xe725;' }}
          </i>
        </div>
        <ElDropdown @command="changeLanguage" popper-class="langDropDownStyle">
          <div class="btn language-btn">
            <i class="iconfont-sys icon-language">&#xe611;</i>
          </div>
          <template #dropdown>
            <ElDropdownMenu>
              <div v-for="lang in languageOptions" :key="lang.value" class="lang-btn-item">
                <ElDropdownItem
                  :command="lang.value"
                  :class="{ 'is-selected': locale === lang.value }"
                >
                  <span class="menu-txt">{{ lang.label }}</span>
                  <i v-if="locale === lang.value" class="iconfont-sys icon-check">&#xe621;</i>
                </ElDropdownItem>
              </div>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
      <div class="header">
        <ArtLogo class="icon" />
        <h1>{{ systemName }}</h1>
      </div>
      <div class="login-wrap">
        <div class="form">
          <h3 class="title">{{ $t('login.title') }}</h3>
          <p class="sub-title">{{ $t('login.subTitle') }}</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="login">
              <ElInput :placeholder="$t('login.placeholder[0]')" v-model.trim="formData.login" />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                :placeholder="$t('login.placeholder[1]')"
                v-model.trim="formData.password"
                type="password"
                radius="8px"
                autocomplete="off"
                show-password
              />
            </ElFormItem>
            <div class="drag-verify">
              <div class="drag-verify-content" :class="{ error: !isPassing && isClickPass }">
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  :text="$t('login.sliderText')"
                  textColor="var(--art-gray-800)"
                  :successText="$t('login.sliderSuccessText')"
                  :progressBarBg="getCssVar('--el-color-primary')"
                  background="var(--art-gray-200)"
                  handlerBg="var(--art-main-bg-color)"
                />
              </div>
              <p class="error-text" :class="{ 'show-error-text': !isPassing && isClickPass }">{{
                $t('login.placeholder[2]')
              }}</p>
            </div>

            <div class="forget-password">
              <ElCheckbox v-model="formData.remember_me">{{ $t('login.rememberMe') }}</ElCheckbox>
              <RouterLink :to="RoutesAlias.ForgetPassword">{{ $t('login.forgetPwd') }}</RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="login-btn"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
              >
                {{ $t('login.btnText') }}
              </ElButton>
            </div>

            <div class="footer">
              <p>
                {{ $t('login.noAccount') }}
                <RouterLink :to="RoutesAlias.Register">{{ $t('login.register') }}</RouterLink>
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
  import { computed } from 'vue'

  // Vue Router
  import { useRouter } from 'vue-router'

  // Pinia Store
  import { useUserStore } from '@/store/modules/user'
  import { useSettingStore } from '@/store/modules/setting'

  // Element Plus
  import { ElNotification, ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  // Composables
  import { useI18n } from 'vue-i18n'

  // 工具函数
  import { getCssVar } from '@/utils/ui'
  import { themeAnimation } from '@/utils/theme/animation'

  // 配置和类型
  import AppConfig from '@/config'
  import { RoutesAlias } from '@/router/routesAlias'
  import { languageOptions } from '@/locales'
  import { LanguageEnum } from '@/enums/appEnum'

  // 服务
  import { authService } from '@/services/core/authService'

  // 错误处理
  import { HttpError } from '@/utils/http/error'

  defineOptions({ name: 'Login' })

  const { t } = useI18n()

  const settingStore = useSettingStore()
  const { isDark } = storeToRefs(settingStore)

  const dragVerify = ref()

  const userStore = useUserStore()
  const router = useRouter()
  const isPassing = ref(false)
  const isClickPass = ref(false)

  const systemName = AppConfig.systemInfo.name
  const formRef = ref<FormInstance>()

  const formData = reactive({
    login: '',
    password: '',
    remember_me: false
  })

  const rules = computed<FormRules>(() => ({
    login: [
      { required: true, message: t('login.placeholder[0]'), trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (!value) {
            callback(new Error(t('login.placeholder[0]')))
          } else {
            // 简单的邮箱格式验证
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const isEmail = emailRegex.test(value)

            // 如果是邮箱格式，检查邮箱长度
            if (isEmail && value.length > 50) {
              callback(new Error(t('login.emailTooLong')))
            }
            // 如果不是邮箱，检查用户名长度
            else if (!isEmail && (value.length < 3 || value.length > 20)) {
              callback(new Error(t('login.usernameLengthError')))
            } else {
              callback()
            }
          }
        },
        trigger: 'blur'
      }
    ],
    password: [
      { required: true, message: t('login.placeholder[1]'), trigger: 'blur' },
      { min: 6, message: t('login.passwordMinLength'), trigger: 'blur' }
    ]
  }))

  const loading = ref(false)

  // 登录
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      // 表单验证
      const valid = await formRef.value.validate()
      if (!valid) return

      // 拖拽验证
      if (!isPassing.value) {
        isClickPass.value = true
        return
      }

      loading.value = true

      // 登录请求
      const { login, password } = formData

      const authResponse = await authService.login({
        login: login,
        password,
        remember_me: formData.remember_me
      })

      // 验证响应
      if (!authResponse.success || !authResponse.token) {
        throw new Error(authResponse.message || '登录失败')
      }

      // 使用新的登录方法处理认证响应
      const loginSuccess = userStore.loginWithAuthResponse(authResponse)

      if (!loginSuccess) {
        throw new Error('登录响应处理失败')
      }

      // 登录成功处理
      showLoginSuccessNotice()
      router.push('/')
    } catch (error) {
      // 处理 HttpError
      if (error instanceof HttpError) {
        ElMessage.error(error.message || '登录失败，请检查用户名和密码')
      } else {
        // 处理非 HttpError
        ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
      }
    } finally {
      loading.value = false
      resetDragVerify()
    }
  }

  // 重置拖拽验证
  const resetDragVerify = () => {
    dragVerify.value.reset()
  }

  // 登录成功提示
  const showLoginSuccessNotice = () => {
    setTimeout(() => {
      ElNotification({
        title: t('login.success.title'),
        type: 'success',
        duration: 2500,
        zIndex: 10000,
        message: `${t('login.success.message')}, ${systemName}!`
      })
    }, 150)
  }

  // 切换语言
  const { locale } = useI18n()

  const changeLanguage = (lang: LanguageEnum) => {
    if (locale.value === lang) return
    locale.value = lang
    userStore.setLanguage(lang)
  }
</script>

<style lang="scss" scoped>
  @use './index';
</style>
