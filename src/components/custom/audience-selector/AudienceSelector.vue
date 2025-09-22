<!-- 目标受众选择组件 -->
<template>
  <div class="audience-selector">
    <div class="audience-grid">
      <div class="audience-item">
        <label class="audience-label">年龄</label>
        <el-select
          v-model="audience.age"
          placeholder="选择年龄段"
          @change="handleChange"
          class="audience-select"
        >
          <el-option label="18-25岁" value="18-25" />
          <el-option label="26-35岁" value="26-35" />
          <el-option label="36-45岁" value="36-45" />
          <el-option label="46-55岁" value="46-55" />
          <el-option label="55岁以上" value="55+" />
        </el-select>
      </div>

      <div class="audience-item">
        <label class="audience-label">性别</label>
        <el-select
          v-model="audience.gender"
          placeholder="选择性别"
          @change="handleChange"
          class="audience-select"
        >
          <el-option label="不限" value="all" />
          <el-option label="男性" value="male" />
          <el-option label="女性" value="female" />
        </el-select>
      </div>

      <div class="audience-item">
        <label class="audience-label">教育水平</label>
        <el-select
          v-model="audience.education"
          placeholder="选择教育水平"
          @change="handleChange"
          class="audience-select"
        >
          <el-option label="小学及以下" value="primary" />
          <el-option label="初中" value="middle" />
          <el-option label="高中" value="high" />
          <el-option label="大专" value="college" />
          <el-option label="本科" value="bachelor" />
          <el-option label="硕士" value="master" />
          <el-option label="博士" value="doctor" />
        </el-select>
      </div>

      <div class="audience-item">
        <label class="audience-label">职业</label>
        <el-select
          v-model="audience.occupation"
          placeholder="选择职业"
          @change="handleChange"
          class="audience-select"
        >
          <el-option label="学生" value="student" />
          <el-option label="教师" value="teacher" />
          <el-option label="工程师" value="engineer" />
          <el-option label="管理人员" value="manager" />
          <el-option label="医生" value="doctor" />
          <el-option label="律师" value="lawyer" />
          <el-option label="企业家" value="entrepreneur" />
          <el-option label="公务员" value="civil_servant" />
          <el-option label="工人" value="worker" />
          <el-option label="农民" value="farmer" />
          <el-option label="自由职业者" value="freelancer" />
          <el-option label="退休人员" value="retired" />
          <el-option label="其他" value="other" />
        </el-select>
      </div>
    </div>

    <!-- 受众描述预览 -->
    <div v-if="audienceDescription" class="audience-preview">
      <div class="preview-header">
        <el-icon><User /></el-icon>
        <span>目标受众预览</span>
      </div>
      <div class="preview-content">
        {{ audienceDescription }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElSelect, ElOption, ElIcon } from 'element-plus'
  import { User } from '@element-plus/icons-vue'

  defineOptions({ name: 'AudienceSelector' })

  interface Audience {
    age: string
    gender: string
    education: string
    occupation: string
  }

  interface AudienceSelectorProps {
    modelValue: Audience
  }

  interface AudienceSelectorEmits {
    'update:modelValue': [value: Audience]
    change: [value: Audience]
  }

  const props = defineProps<AudienceSelectorProps>()
  const emit = defineEmits<AudienceSelectorEmits>()

  const audience = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 受众描述
  const audienceDescription = computed(() => {
    const parts = []
    if (audience.value.age) parts.push(getAgeText(audience.value.age))
    if (audience.value.gender) parts.push(getGenderText(audience.value.gender))
    if (audience.value.education) parts.push(getEducationText(audience.value.education))
    if (audience.value.occupation) parts.push(getOccupationText(audience.value.occupation))
    return parts.length > 0 ? parts.join('、') : ''
  })

  // 处理变化
  const handleChange = () => {
    emit('change', audience.value)
  }

  // 获取年龄文本
  const getAgeText = (age: string) => {
    const ages: Record<string, string> = {
      '18-25': '18-25岁年轻群体',
      '26-35': '26-35岁青年群体',
      '36-45': '36-45岁中年群体',
      '46-55': '46-55岁中老年群体',
      '55+': '55岁以上群体'
    }
    return ages[age] || age
  }

  // 获取性别文本
  const getGenderText = (gender: string) => {
    const genders: Record<string, string> = {
      male: '男性',
      female: '女性',
      all: '不限性别'
    }
    return genders[gender] || gender
  }

  // 获取教育文本
  const getEducationText = (education: string) => {
    const educations: Record<string, string> = {
      primary: '小学及以下',
      middle: '初中',
      high: '高中',
      college: '大专',
      bachelor: '本科',
      master: '硕士',
      doctor: '博士'
    }
    return educations[education] || education
  }

  // 获取职业文本
  const getOccupationText = (occupation: string) => {
    const occupations: Record<string, string> = {
      student: '学生',
      teacher: '教师',
      engineer: '工程师',
      manager: '管理人员',
      doctor: '医生',
      lawyer: '律师',
      entrepreneur: '企业家',
      civil_servant: '公务员',
      worker: '工人',
      farmer: '农民',
      freelancer: '自由职业者',
      retired: '退休人员',
      other: '其他'
    }
    return occupations[occupation] || occupation
  }
</script>

<style scoped lang="scss">
  .audience-selector {
    .audience-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      .audience-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .audience-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--el-text-color-regular);
        }

        .audience-select {
          width: 100%;
        }
      }
    }

    .audience-preview {
      padding: 12px 16px;
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color);
      border-radius: 6px;

      .preview-header {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-regular);

        .el-icon {
          font-size: 14px;
          color: var(--el-color-primary);
        }
      }

      .preview-content {
        font-size: 14px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
      }
    }
  }

  // 响应式设计
  @media (width <= 768px) {
    .audience-selector {
      .audience-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }
  }
</style>
