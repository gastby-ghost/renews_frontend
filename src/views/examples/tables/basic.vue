<!-- 基础表格 -->
<template>
  <div class="user-page art-full-height">
    <ElCard class="art-table-card" shadow="never" style="margin-top: 0">
      <!-- 表格 -->
      <ArtTable
        rowKey="id"
        :show-table-header="false"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'

  defineOptions({ name: 'UserMixedUsageExample' })

  // 模拟的用户列表获取函数，因为原方法已从 UserService 中移除
  const getUserList = (params: Api.Common.PaginatingSearchParams) => {
    console.warn('getUserList 方法已从 UserService 中移除，这里使用模拟数据')
    // 返回模拟数据，实际项目中应该替换为新的API调用
    return Promise.resolve({
      records: [],
      total: 0,
      current: params.current || 1,
      size: params.size || 20
    })
  }

  const { data, columns, loading, pagination, handleSizeChange, handleCurrentChange } =
    useTable<Api.User.UserListItem>({
      core: {
        apiFn: getUserList,
        apiParams: {
          current: 1,
          size: 20,
          name: '',
          phone: '',
          address: undefined
        },
        columnsFactory: () => [
          {
            prop: 'id',
            label: 'ID'
          },
          {
            prop: 'nickName',
            label: '昵称'
          },
          {
            prop: 'userGender',
            label: '性别',
            sortable: true,
            formatter: (row) => row.userGender || '未知'
          },
          {
            prop: 'userPhone',
            label: '手机号'
          },
          {
            prop: 'userEmail',
            label: '邮箱'
          }
        ]
      }
    })
</script>
