<template>
  <div class="user-preferences">
    <div class="preferences-container">
      <div class="preferences-header">
        <h2>{{ $t('userPreferences.title') }}</h2>
        <p class="subtitle">{{ $t('userPreferences.subtitle') }}</p>
      </div>

      <div class="preferences-content">
        <ElCard class="preferences-card">
          <template #header>
            <div class="card-header">
              <ElIcon><Setting /></ElIcon>
              <span>{{ $t('userPreferences.theme.title') }}</span>
            </div>
          </template>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.theme.title') }}</span>
            </div>
            <div class="preference-control">
              <ElRadioGroup v-model="preferences.theme" @change="handleThemeChange">
                <ElRadio value="light">{{ $t('userPreferences.theme.light') }}</ElRadio>
                <ElRadio value="dark">{{ $t('userPreferences.theme.dark') }}</ElRadio>
                <ElRadio value="auto">{{ $t('userPreferences.theme.auto') }}</ElRadio>
              </ElRadioGroup>
            </div>
          </div>
        </ElCard>

        <ElCard class="preferences-card">
          <template #header>
            <div class="card-header">
              <ElIcon><FontSize /></ElIcon>
              <span>{{ $t('userPreferences.fontSize.title') }}</span>
            </div>
          </template>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.fontSize.title') }}</span>
            </div>
            <div class="preference-control">
              <ElSelect v-model="preferences.font_size" @change="handleFontSizeChange">
                <ElOption value="small" :label="$t('userPreferences.fontSize.small')" />
                <ElOption value="medium" :label="$t('userPreferences.fontSize.medium')" />
                <ElOption value="large" :label="$t('userPreferences.fontSize.large')" />
              </ElSelect>
            </div>
          </div>
        </ElCard>

        <ElCard class="preferences-card">
          <template #header>
            <div class="card-header">
              <ElIcon><Globe /></ElIcon>
              <span>{{ $t('userPreferences.language.title') }}</span>
            </div>
          </template>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.language.title') }}</span>
            </div>
            <div class="preference-control">
              <ElSelect v-model="preferences.language" @change="handleLanguageChange">
                <ElOption value="zh-CN" label="简体中文" />
                <ElOption value="en-US" label="English" />
              </ElSelect>
            </div>
          </div>
        </ElCard>

        <ElCard class="preferences-card">
          <template #header>
            <div class="card-header">
              <ElIcon><Clock /></ElIcon>
              <span>{{ $t('userPreferences.autoSave.title') }}</span>
            </div>
          </template>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.autoSave.title') }}</span>
            </div>
            <div class="preference-control">
              <ElSelect v-model="preferences.auto_save_frequency" @change="handleAutoSaveChange">
                <ElOption value="1" :label="`1 ${$t('userPreferences.autoSave.minutes')}`" />
                <ElOption value="3" :label="`3 ${$t('userPreferences.autoSave.minutes')}`" />
                <ElOption value="5" :label="`5 ${$t('userPreferences.autoSave.minutes')}`" />
                <ElOption value="10" :label="`10 ${$t('userPreferences.autoSave.minutes')}`" />
                <ElOption value="15" :label="`15 ${$t('userPreferences.autoSave.minutes')}`" />
                <ElOption value="30" :label="`30 ${$t('userPreferences.autoSave.minutes')}`" />
              </ElSelect>
            </div>
          </div>
        </ElCard>

        <ElCard class="preferences-card">
          <template #header>
            <div class="card-header">
              <ElIcon><Bell /></ElIcon>
              <span>{{ $t('userPreferences.notifications.title') }}</span>
            </div>
          </template>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.notifications.enabled') }}</span>
            </div>
            <div class="preference-control">
              <ElSwitch
                v-model="preferences.notifications_enabled"
                @change="
                  (val: string | number | boolean) => handleNotificationChange(val as boolean)
                "
              />
            </div>
          </div>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.notifications.sound') }}</span>
            </div>
            <div class="preference-control">
              <ElSwitch
                v-model="preferences.sound_enabled"
                @change="(val: string | number | boolean) => handleSoundChange(val as boolean)"
                :disabled="!preferences.notifications_enabled"
              />
            </div>
          </div>
        </ElCard>

        <ElCard class="preferences-card">
          <template #header>
            <div class="card-header">
              <ElIcon><Tools /></ElIcon>
              <span>{{ $t('userPreferences.other.title') }}</span>
            </div>
          </template>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.other.compactMode') }}</span>
            </div>
            <div class="preference-control">
              <ElSwitch
                v-model="preferences.compact_mode"
                @change="
                  (val: string | number | boolean) => handleCompactModeChange(val as boolean)
                "
              />
            </div>
          </div>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.other.showTooltips') }}</span>
            </div>
            <div class="preference-control">
              <ElSwitch
                v-model="preferences.show_tooltips"
                @change="(val: string | number | boolean) => handleTooltipsChange(val as boolean)"
              />
            </div>
          </div>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.other.autoComplete') }}</span>
            </div>
            <div class="preference-control">
              <ElSwitch
                v-model="preferences.auto_complete"
                @change="
                  (val: string | number | boolean) => handleAutoCompleteChange(val as boolean)
                "
              />
            </div>
          </div>

          <div class="preference-item">
            <div class="preference-label">
              <span>{{ $t('userPreferences.other.spellCheck') }}</span>
            </div>
            <div class="preference-control">
              <ElSwitch
                v-model="preferences.spell_check"
                @change="(val: string | number | boolean) => handleSpellCheckChange(val as boolean)"
              />
            </div>
          </div>
        </ElCard>

        <div class="preferences-actions">
          <ElButton type="primary" @click="savePreferences" :loading="saving">
            {{ $t('userPreferences.buttons.save') }}
          </ElButton>
          <ElButton @click="resetPreferences">
            {{ $t('userPreferences.buttons.reset') }}
          </ElButton>
          <ElButton @click="exportPreferences">
            {{ $t('userPreferences.buttons.export') }}
          </ElButton>
          <ElButton @click="importPreferences">
            {{ $t('userPreferences.buttons.import') }}
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入用于导入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { Setting, Clock, Bell, Tools } from '@element-plus/icons-vue'
  import { HttpError } from '@/utils/http/error'
  import { systemPreferencesService } from '@/services/systemPreferencesService'

  defineOptions({ name: 'UserPreferences' })

  const { t } = useI18n()
  const fileInput = ref<HTMLInputElement>()

  // 用户偏好设置
  const preferences = ref({
    user_id: '',
    theme: 'light',
    font_size: 'medium',
    auto_save_frequency: '5',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    notifications_enabled: true,
    sound_enabled: true,
    compact_mode: false,
    show_tooltips: true,
    auto_complete: true,
    spell_check: false,
    custom_settings: {}
  })

  // 默认偏好设置
  const defaultPreferences = ref({
    user_id: '',
    theme: 'light',
    font_size: 'medium',
    auto_save_frequency: '5',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    notifications_enabled: true,
    sound_enabled: true,
    compact_mode: false,
    show_tooltips: true,
    auto_complete: true,
    spell_check: false,
    custom_settings: {}
  })

  const saving = ref(false)
  const isLoading = ref(true)

  // 获取用户偏好设置
  const fetchPreferences = async () => {
    try {
      const response = await systemPreferencesService.getUserPreferences()

      if (response && response.user_id) {
        preferences.value = { ...defaultPreferences.value, ...response }
      }
    } catch {
      ElMessage.error('获取用户偏好设置失败，使用默认设置')
    } finally {
      isLoading.value = false
    }
  }

  // 保存偏好设置
  const savePreferences = async () => {
    try {
      saving.value = true

      const updateData = {
        theme: preferences.value.theme,
        font_size: preferences.value.font_size,
        auto_save_interval: parseInt(preferences.value.auto_save_frequency || '5'),
        language: preferences.value.language,
        timezone: preferences.value.timezone,
        notifications_enabled: preferences.value.notifications_enabled,
        sound_enabled: preferences.value.sound_enabled,
        compact_mode: preferences.value.compact_mode,
        show_tooltips: preferences.value.show_tooltips,
        auto_complete: preferences.value.auto_complete,
        spell_check: preferences.value.spell_check,
        custom_settings: preferences.value.custom_settings
      }

      await systemPreferencesService.updateUserPreferences(updateData)
      ElMessage.success(t('userPreferences.messages.saveSuccess'))
    } catch (error) {
      if (error instanceof HttpError) {
        ElMessage.error(error.message || '保存失败')
      } else {
        ElMessage.error('保存失败，请稍后重试')
      }
    } finally {
      saving.value = false
    }
  }

  // 重置偏好设置
  const resetPreferences = async () => {
    try {
      await ElMessageBox.confirm('确定要重置所有偏好设置为默认值吗？此操作不可恢复。', '确认重置', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      const response = await systemPreferencesService.resetUserPreferences()

      if (response && response.theme) {
        preferences.value = {
          ...defaultPreferences.value,
          ...response,
          user_id: String(response.user_id),
          theme: response.theme as 'light' | 'dark' | 'auto',
          font_size: response.font_size as 'small' | 'medium' | 'large',
          auto_save_frequency: String(response.auto_save_interval || '5') as
            | '1'
            | '3'
            | '5'
            | '10'
            | '15'
            | '30',
          updated_at: response.updated_at || undefined
        }

        ElMessage.success(t('userPreferences.messages.resetSuccess'))
      }
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('重置失败，请稍后重试')
      }
    }
  }

  // 导出偏好设置
  const exportPreferences = () => {
    try {
      const dataStr = JSON.stringify(preferences.value, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'user-preferences.json'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      ElMessage.error('导出失败，请稍后重试')
    }
  }

  // 导入偏好设置
  const importPreferences = () => {
    fileInput.value?.click()
  }

  // 处理文件导入
  const handleFileImport = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const importedPrefs = JSON.parse(content)

        // 验证导入的数据
        if (importedPrefs && typeof importedPrefs === 'object') {
          preferences.value = { ...defaultPreferences.value, ...importedPrefs }

          ElMessage.success(t('userPreferences.messages.importSuccess'))
        } else {
          throw new Error('无效的偏好设置文件格式')
        }
      } catch {
        ElMessage.error(t('userPreferences.messages.importError'))
      }
    }

    reader.readAsText(file)

    // 清空文件输入
    target.value = ''
  }

  // 处理各种设置变更
  const handleThemeChange = () => {
    // 应用主题设置
  }

  const handleFontSizeChange = (value: string) => {
    // 应用字体大小设置
    document.documentElement.style.fontSize =
      value === 'small' ? '14px' : value === 'large' ? '18px' : '16px'
  }

  const handleLanguageChange = () => {
    // 应用语言设置
  }

  const handleAutoSaveChange = () => {
    // 应用自动保存频率设置
  }

  const handleNotificationChange = () => {
    // 应用通知设置
  }

  const handleSoundChange = () => {
    // 应用声音设置
  }

  const handleCompactModeChange = () => {
    // 应用紧凑模式设置
  }

  const handleTooltipsChange = () => {
    // 应用工具提示设置
  }

  const handleAutoCompleteChange = () => {
    // 应用自动完成设置
  }

  const handleSpellCheckChange = () => {
    // 应用拼写检查设置
  }

  onMounted(() => {
    fetchPreferences()
  })
</script>

<style lang="scss" scoped>
  .user-preferences {
    min-height: calc(100vh - 84px);
    padding: 24px;
    background-color: var(--art-bg-color);
  }

  .preferences-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .preferences-header {
    margin-bottom: 24px;
    text-align: center;

    h2 {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 600;
      color: var(--art-text-color);
    }

    .subtitle {
      margin: 0;
      font-size: 16px;
      color: var(--art-gray-600);
    }
  }

  .preferences-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .preferences-card {
    .card-header {
      display: flex;
      gap: 8px;
      align-items: center;
      font-weight: 600;
    }
  }

  .preference-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--art-border-color);

    &:last-child {
      border-bottom: none;
    }

    .preference-label {
      font-weight: 500;
      color: var(--art-text-color);
    }

    .preference-control {
      display: flex;
      align-items: center;
    }
  }

  .preferences-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    padding: 16px;
    margin-top: 24px;
    background-color: var(--art-main-bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  }

  @media (width <= 768px) {
    .user-preferences {
      padding: 16px;
    }

    .preference-item {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }

    .preferences-actions {
      flex-wrap: wrap;
    }
  }
</style>
