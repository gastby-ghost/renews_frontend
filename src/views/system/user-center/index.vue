<template>
  <div class="page-content user">
    <div class="content">
      <div class="left-wrap">
        <div class="user-wrap box-style">
          <img class="bg" src="@imgs/user/bg.webp" />
          <img class="avatar" :src="userInfo.avatar || '@imgs/user/avatar.webp'" />
          <h2 class="name">{{ userInfo.username }}</h2>
          <p class="des">{{ date }}</p>

          <div class="outer-info">
            <div>
              <i class="iconfont-sys">&#xe72e;</i>
              <span>{{ userInfo.email }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe608;</i>
              <span>{{ userInfo.is_active ? '活跃用户' : '非活跃用户' }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe736;</i>
              <span>{{ userInfo.is_verified ? '已验证' : '未验证' }}</span>
            </div>
            <div>
              <i class="iconfont-sys">&#xe811;</i>
              <span
                >注册时间:
                {{ userInfo.created_at ? formatDate(userInfo.created_at) : '未知' }}</span
              >
            </div>
          </div>

          <div class="lables">
            <h3>标签</h3>
            <div>
              <div v-for="item in lableList" :key="item">
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <!-- <el-carousel class="gallery" height="160px"
          :interval="5000"
          indicator-position="none"
        >
          <el-carousel-item class="item" v-for="item in galleryList" :key="item">
            <img :src="item"/>
          </el-carousel-item>
        </el-carousel> -->
      </div>
      <div class="right-wrap">
        <div class="info box-style">
          <h1 class="title">基本设置</h1>

          <ElForm
            :model="form"
            class="form"
            ref="ruleFormRef"
            :rules="rules"
            label-width="86px"
            label-position="top"
          >
            <ElRow>
              <ElFormItem label="用户名" prop="username">
                <ElInput v-model="form.username" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="邮箱" prop="email" class="right-input">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="昵称" prop="nickName">
                <ElInput v-model="form.nickName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="头像" prop="avatar" class="right-input">
                <ElInput v-model="form.avatar" :disabled="!isEdit" placeholder="头像URL" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="手机" prop="mobile">
                <ElInput v-model="form.mobile" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="地址" prop="address" class="right-input">
                <ElInput v-model="form.address" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElFormItem label="个人介绍" prop="des" :style="{ height: '130px' }">
              <ElInput type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton
                type="primary"
                style="width: 90px"
                v-ripple
                @click="edit"
                :loading="isLoading"
              >
                {{ isEdit ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>

        <div class="info box-style" style="margin-top: 20px">
          <h1 class="title">更改密码</h1>

          <ElForm :model="pwdForm" class="form" label-width="86px" label-position="top">
            <ElFormItem label="当前密码" prop="password">
              <ElInput
                v-model="pwdForm.password"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="新密码" prop="newPassword">
              <ElInput
                v-model="pwdForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="确认新密码" prop="confirmPassword">
              <ElInput
                v-model="pwdForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <div class="el-form-item-right">
              <ElButton type="primary" style="width: 90px" v-ripple @click="editPwd">
                {{ isEditPwd ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { authService } from '@/services/authService'
  import { ElForm, FormInstance, FormRules, ElMessage } from 'element-plus'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const isLoading = ref(false)
  const date = ref('')

  // 表单数据 - 基于 core API 的实际字段
  const form = reactive({
    username: '',
    email: '',
    avatar: '',
    realName: '',
    nickName: '',
    mobile: '',
    address: '',
    sex: '',
    des: ''
  })

  const pwdForm = reactive({
    password: '123456',
    newPassword: '123456',
    confirmPassword: '123456'
  })

  const ruleFormRef = ref<FormInstance>()

  const rules = reactive<FormRules>({
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    nickName: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ]
  })

  const lableList: Array<string> = ['专注设计', '很有想法', '辣~', '大长腿', '川妹子', '海纳百川']

  onMounted(() => {
    getDate()
    loadUserData()
  })

  // 加载用户数据
  const loadUserData = async () => {
    if (userInfo.value) {
      // 从用户信息填充表单
      form.username = userInfo.value.username || ''
      form.email = userInfo.value.email || ''
      form.avatar = userInfo.value.avatar || ''
      form.realName = userInfo.value.username || ''
      form.nickName = userInfo.value.username || ''
    }
  }

  // 保存用户信息
  const saveUserInfo = async () => {
    if (!ruleFormRef.value) return

    try {
      await ruleFormRef.value.validate()
      isLoading.value = true

      // 只更新 API 支持的字段
      const updateData = {
        username: form.username,
        email: form.email,
        avatar: form.avatar
      }

      const response = await authService.updateAccount(updateData)

      if (response.success) {
        ElMessage.success('用户信息更新成功')
        // 更新本地存储的用户信息
        userStore.setUserInfo(response)
        isEdit.value = false
      } else {
        ElMessage.error('用户信息更新失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      ElMessage.error('保存失败，请检查输入内容')
    } finally {
      isLoading.value = false
    }
  }

  const getDate = () => {
    const d = new Date()
    const h = d.getHours()
    let text = ''

    if (h >= 6 && h < 9) {
      text = '早上好'
    } else if (h >= 9 && h < 11) {
      text = '上午好'
    } else if (h >= 11 && h < 13) {
      text = '中午好'
    } else if (h >= 13 && h < 18) {
      text = '下午好'
    } else if (h >= 18 && h < 24) {
      text = '晚上好'
    } else if (h >= 0 && h < 6) {
      text = '很晚了，早点睡'
    }

    date.value = text
  }

  const edit = async () => {
    if (isEdit.value) {
      // 保存模式
      await saveUserInfo()
    } else {
      // 编辑模式
      isEdit.value = true
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '未知'
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  const editPwd = () => {
    isEditPwd.value = !isEditPwd.value
  }
</script>

<style lang="scss">
  .user {
    .icon {
      width: 1.4em;
      height: 1.4em;
      overflow: hidden;
      vertical-align: -0.15em;
      fill: currentcolor;
    }
  }
</style>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;

    $box-radius: calc(var(--custom-radius) + 4px);

    .box-style {
      border: 1px solid var(--art-border-color);
    }

    .content {
      position: relative;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;

      .left-wrap {
        width: 450px;
        margin-right: 25px;

        .user-wrap {
          position: relative;
          height: 600px;
          padding: 35px 40px;
          overflow: hidden;
          text-align: center;
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 200px;
            object-fit: cover;
          }

          .avatar {
            position: relative;
            z-index: 10;
            width: 80px;
            height: 80px;
            margin-top: 120px;
            object-fit: cover;
            border: 2px solid #fff;
            border-radius: 50%;
          }

          .name {
            margin-top: 20px;
            font-size: 22px;
            font-weight: 400;
          }

          .des {
            margin-top: 20px;
            font-size: 14px;
          }

          .outer-info {
            width: 300px;
            margin: auto;
            margin-top: 30px;
            text-align: left;

            > div {
              margin-top: 10px;

              span {
                margin-left: 8px;
                font-size: 14px;
              }
            }
          }

          .lables {
            margin-top: 40px;

            h3 {
              font-size: 15px;
              font-weight: 500;
            }

            > div {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              margin-top: 15px;

              > div {
                padding: 3px 6px;
                margin: 0 10px 10px 0;
                font-size: 12px;
                background: var(--art-main-bg-color);
                border: 1px solid var(--art-border-color);
                border-radius: 2px;
              }
            }
          }
        }

        .gallery {
          margin-top: 25px;
          border-radius: 10px;

          .item {
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }
        }
      }

      .right-wrap {
        flex: 1;
        overflow: hidden;
        border-radius: $box-radius;

        .info {
          background: var(--art-main-bg-color);
          border-radius: $box-radius;

          .title {
            padding: 15px 25px;
            font-size: 20px;
            font-weight: 400;
            color: var(--art-text-gray-800);
            border-bottom: 1px solid var(--art-border-color);
          }

          .form {
            box-sizing: border-box;
            padding: 30px 25px;

            > .el-row {
              .el-form-item {
                width: calc(50% - 10px);
              }

              .el-input,
              .el-select {
                width: 100%;
              }
            }

            .right-input {
              margin-left: 20px;
            }

            .el-form-item-right {
              display: flex;
              align-items: center;
              justify-content: end;

              .el-button {
                width: 110px !important;
              }
            }
          }
        }
      }
    }
  }

  @media only screen and (max-width: $device-ipad-vertical) {
    .page-content {
      .content {
        display: block;
        margin-top: 5px;

        .left-wrap {
          width: 100%;
        }

        .right-wrap {
          width: 100%;
          margin-top: 15px;
        }
      }
    }
  }
</style>
