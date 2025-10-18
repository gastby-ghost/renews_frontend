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
            <ElFormItem prop="account">
              <ElSelect v-model="formData.account" @change="setupAccount" class="account-select">
                <ElOption
                  v-for="account in accounts"
                  :key="account.key"
                  :label="account.label"
                  :value="account.key"
                >
                  <span>{{ account.label }}</span>
                </ElOption>
              </ElSelect>
            </ElFormItem>
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
  import AppConfig from '@/config'
  import { RoutesAlias } from '@/router/routesAlias'
  import { ElNotification, ElMessage } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { getCssVar } from '@/utils/ui'
  import { languageOptions } from '@/locales'
  import { LanguageEnum } from '@/enums/appEnum'
  import { useI18n } from 'vue-i18n'
  import { HttpError } from '@/utils/http/error'
  import { themeAnimation } from '@/utils/theme/animation'
  import { AuthService } from '@/api/authApi'
  import { UserService } from '@/api/usersApi'

  defineOptions({ name: 'Login' })

  const { t } = useI18n()
  import { useSettingStore } from '@/store/modules/setting'
  import type { FormInstance, FormRules } from 'element-plus'

  type AccountKey = 'super' | 'admin' | 'user'

  export interface Account {
    key: AccountKey
    label: string
    userName: string
    password: string
    roles: string[]
  }

  const accounts = computed<Account[]>(() => [
    {
      key: 'super',
      label: t('login.roles.super'),
      userName: 'Super',
      password: '123456',
      roles: ['R_SUPER']
    },
    {
      key: 'admin',
      label: t('login.roles.admin'),
      userName: 'Admin',
      password: '123456',
      roles: ['R_ADMIN']
    },
    {
      key: 'user',
      label: t('login.roles.user'),
      userName: 'User',
      password: '123456',
      roles: ['R_USER']
    }
  ])

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
    account: '',
    login: '',
    password: '',
    remember_me: false
  })

  const rules = computed<FormRules>(() => ({
    login: [
      { required: true, message: t('login.placeholder[0]'), trigger: 'blur' },
      {
        validator: (rule: any, value: string, callback: any) => {
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

  onMounted(() => {
    setupAccount('super')
  })

  // 设置账号
  const setupAccount = (key: AccountKey) => {
    const selectedAccount = accounts.value.find((account: Account) => account.key === key)
    formData.account = key
    formData.login = selectedAccount?.userName ?? ''
    formData.password = selectedAccount?.password ?? ''
  }

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

      console.log('[Login] 开始登录请求:', {
        login,
        password: password ? '***' : 'empty',
        remember_me: formData.remember_me,
        apiUrl: import.meta.env.VITE_API_URL
      })

      const authResponse = await AuthService.login(
        {
          login,
          password,
          remember_me: formData.remember_me
        },
        {
          // 禁用自动错误显示，因为我们将在catch块中处理
          showErrorMessage: false
        }
      )

      console.log('[Login] 登录响应:', authResponse)

      // 验证响应
      if (!authResponse.success || !authResponse.token) {
        console.log('[Login] 登录响应验证失败:', {
          success: authResponse.success,
          hasToken: !!authResponse.token,
          message: authResponse.message
        })
        throw new Error(authResponse.message || '登录失败')
      }

      // 使用新的登录方法处理认证响应
      const loginSuccess = userStore.loginWithAuthResponse(authResponse)
      console.log('[Login] 登录响应处理结果:', loginSuccess)

      if (!loginSuccess) {
        throw new Error('登录响应处理失败')
      }

      // 如果认证响应中没有用户信息，单独获取
      if (!authResponse.user) {
        try {
          console.log('[Login] 获取用户信息...')
          const userInfo = await UserService.getUserInfo()
          userStore.setUserInfo(userInfo)
          console.log('[Login] 用户信息获取成功:', userInfo)
        } catch (userInfoError) {
          console.warn('获取用户信息失败，但登录成功:', userInfoError)
        }
      }

      // 登录成功处理
      showLoginSuccessNotice()
      router.push('/')
    } catch (error) {
      console.error('[Login] 登录错误:', error)
      // 处理 HttpError
      if (error instanceof HttpError) {
        ElMessage.error(error.message || '登录失败，请检查用户名和密码')
      } else {
        // 处理非 HttpError
        ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
        console.error('[Login] Unexpected error:', error)
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
