# Vue 3.0 最优实践指南

本文档定义了 Vue 3.0 项目的编码规范和最佳实践，适用于使用 Composition API + TypeScript 的项目。

## 目录

- [组件设计原则](#组件设计原则)
- [Composition API 规范](#composition-api-规范)
- [Composable 模式](#composable-模式)
- [TypeScript 集成](#typescript-集成)
- [状态管理](#状态管理)
- [性能优化](#性能优化)
- [目录结构](#目录结构)

---

## 组件设计原则

### 1. 单一职责原则

每个组件应专注于单一功能，避免创建巨型组件。

```typescript
<!-- 好的做法：职责单一的组件 -->
<template>
  <TitleSection :title="title" @edit="handleEdit" />
</template>

<script setup lang="ts">
// 业务逻辑已提取到 composables
</script>

<!-- 不好的做法：职责不明确的组件 -->
<template>
  <div>
    <!-- 标题逻辑 -->
    <!-- 素材逻辑 -->
    <!-- 大纲逻辑 -->
    <!-- 内容逻辑 -->
  </div>
</template>
```

### 2. Props 和 Emits 类型定义

始终使用 TypeScript 类型定义 props 和 emits。

```typescript
// ✅ 推荐：完整的类型定义
interface Props {
  title: string
  items?: Item[]
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  loading: false,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', item: Item): void
  (e: 'cancel'): void
}>()

// ❌ 不推荐：缺少类型或使用 any
const props = defineProps({
  title: String,
  items: Array
})
```

### 3. 组件命名规范

- 使用 PascalCase 进行组件命名
- 使用前缀区分组件类型（如 `Base` 基础组件、`Art` 业务组件）

```typescript
// 文件名
BaseButton.vue
BaseCard.vue
ArtDocumentOutline.vue
```

---

## Composition API 规范

### 1. 使用 `<script setup>`

始终使用 `<script setup>` 语法，它更简洁且性能更好。

```typescript
// ✅ 推荐
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const count = ref(0)
const router = useRouter()
</script>

// ❌ 不推荐
<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0)
    return { count }
  }
})
</script>
```

### 2. 导入顺序

保持导入顺序一致：

```typescript
<script setup lang="ts">
// 1. Vue 核心导入
import { ref, computed, watch, onMounted, nextTick } from 'vue'

// 2. Vue Router
import { useRouter, useRoute } from 'vue-router'

// 3. Pinia Store
import { useUserStore } from '@/stores/user'

// 4. 类型导入
import type { User, Item } from '@/types/core'

// 5. 组件导入
import BaseCard from '@/components/core/BaseCard.vue'

// 6. Composables 导入
import { usePagination } from '@/composables/core/usePagination'

// 7. 工具函数
import { formatDate } from '@/utils/format'
</script>
```

### 3. 响应式解构

使用解构时保持响应式：

```typescript
// ✅ 推荐：解构并保持响应式
const { user, loading, refresh } = useUserStore()

// ✅ 推荐：需要响应式时使用 storeToRefs
import { storeToRefs } from 'pinia'
const { user, loading } = storeToRefs(userStore)

// ❌ 不推荐：丢失响应性
const user = userStore.user
const loading = userStore.loading
```

---

## Composable 模式

### 1. Composable 命名规范

以 `use` 开头，使用 camelCase。

```typescript
// ✅ 推荐
export function usePagination(options: PaginationOptions)
export function useFormValidator(rules: Rules)
export function useUserSession()

// ❌ 不推荐
export function pagination(options: PaginationOptions)
export function FormValidator(rules: Rules)
```

### 2. 参数接收模式

使用 Options Object 模式接收参数，支持 getter。

```typescript
// ✅ 推荐：支持 getter 的参数对象
interface UseUserOptions {
  userId: Ref<string> | string
  autoFetch?: boolean
}

export function useUser(options: UseUserOptions) {
  const { userId, autoFetch = true } = options

  // 内部可以监听变化
  watch(userId, (id) => {
    if (typeof id === 'string') {
      fetchUser(id)
    }
  })

  return {
    /* ... */
  }
}

// 使用时
const user = useUser({
  userId: () => props.id,
  autoFetch: true
})
```

### 3. 返回值规范

返回带有明确命名约定的对象：

```typescript
export function useSearch(options: SearchOptions) {
  // 状态（名词）
  const searchResults = ref([])
  const loading = ref(false)

  // 计算属性（名词）
  const isEmpty = computed(() => !loading.value && searchResults.value.length === 0)

  // 方法（动词）
  const executeSearch = async () => {
    /* ... */
  }
  const clearResults = () => {
    /* ... */
  }
  const loadMore = async () => {
    /* ... */
  }

  return {
    // 状态
    searchResults,
    loading,

    // 计算属性
    isEmpty,

    // 方法
    executeSearch,
    clearResults,
    loadMore
  }
}
```

### 4. 避免返回 undefined/null

始终返回有意义的值：

```typescript
// ✅ 推荐：返回空数组而非 undefined
const items = computed(() => (props.items?.length ? props.items : []))

// ❌ 不推荐：可能返回 undefined
const items = computed(() => props.items)
```

---

## TypeScript 集成

### 1. 类型定义位置

- 组件 Props/Emits 类型直接定义在组件文件中
- 复用类型定义在 `@/types/` 目录下
- Composables 的类型定义在同一文件或 `types/` 子目录

```
src/
├── types/
│   ├── core/           # 核心业务类型
│   │   ├── user.ts
│   │   └── material.ts
│   ├── api/            # API 响应类型
│   └── global/         # 全局通用类型
├── composables/
│   └── document/
│       ├── useDocument.ts
│       └── types/      # Composable 专用类型
```

### 2. 类型导出规范

```typescript
// types/document/session.ts

// 类型定义
export interface Session {
  id: string
  title: string
  createdAt: Date
}

// Composables 类型
export interface UseSessionOptions {
  sessionId: string
}

export function useSession(options: UseSessionOptions): UseSessionReturn

export interface UseSessionReturn {
  session: Ref<Session | null>
  update: (data: Partial<Session>) => Promise<void>
  delete: () => Promise<void>
}
```

### 3. 避免 any

```typescript
// ✅ 推荐：明确的类型
interface User {
  id: number
  name: string
  email: string
}

const users: User[] = await fetchUsers()

// ✅ 推荐：unknown + 类型守卫
async function handleData(data: unknown) {
  if (isUserData(data)) {
    // data 被推断为 User 类型
  }
}

// ❌ 不推荐：使用 any
const data: any = await fetchData()
```

---

## 状态管理

### 1. Pinia 使用规范

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types/core'

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string>('')

  // 计算属性
  const isLoggedIn = computed(() => !!user.value && !!token.value)

  // 方法
  function setUser(u: User) {
    user.value = u
  }

  function logout() {
    user.value = null
    token.value = ''
  }

  return {
    user,
    token,
    isLoggedIn,
    setUser,
    logout
  }
})
```

### 2. Store 命名

- 使用 `useXxxStore` 命名
- 使用单数形式（如 `useUserStore` 而非 `useUsersStore`）

---

## 性能优化

### 1. 浅层响应式

对不需要深层响应的大型对象使用 `shallowRef`：

```typescript
import { shallowRef, triggerRef } from 'vue'

// ✅ 推荐：大型只读对象使用 shallowRef
const largeData = shallowRef({
  /* 大对象 */
})

// 更新时触发
function updateData() {
  largeData.value = newData
  triggerRef(largeData)
}

// ❌ 不推荐：深层响应式影响性能
const largeData = ref({
  /* 大对象 */
})
```

### 2. 组件懒加载

```typescript
// router/index.ts
const routes = [
  {
    path: '/document',
    component: () => import('@/views/document/index.vue')
  }
]
```

### 3. 使用 defineAsyncComponent

```typescript
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))
```

### 4. v-memo 缓存

```typescript
// 虚拟列表项优化
<template>
  <div v-for="item in list" :key="item.id" v-memo="[item.selected]">
    {{ item.content }}
  </div>
</template>
```

---

## 目录结构

### 推荐的项目结构

```
src/
├── assets/              # 静态资源
├── components/          # 组件
│   ├── core/           # 基础组件（Button, Card, Table 等）
│   │   ├── BaseButton.vue
│   │   └── index.ts
│   └── custom/          # 业务组件
│       └── document/
│           ├── outline/
│           │   ├── TitleSection.vue
│           │   ├── OutlineEditorSection.vue
│           │   └── index.ts
│           └── content/
│               └── AIDialog.vue
├── composables/         # 组合式函数
│   ├── core/           # 通用 composables
│   │   ├── usePagination.ts
│   │   └── useFormValidator.ts
│   ├── document/        # 文档相关
│   │   ├── useOutlinePage.ts
│   │   ├── useTitleSection.ts
│   │   └── index.ts
│   └── index.ts
├── config/              # 配置文件
├── directives/         # 自定义指令
├── enums/              # 枚举定义
├── locales/            # 国际化
├── router/             # 路由
├── services/           # API 服务层
├── store/              # Pinia 状态管理
├── types/              # TypeScript 类型
├── utils/              # 工具函数
└── views/              # 页面组件
```

---

## 其他规范

### 1. 样式作用域

使用 `scoped` CSS/SCSS：

```scss
<style scoped>
.button {
  /* 只作用于当前组件 */
}
</style>
```

### 2. 事件命名

使用 kebab-case：

```typescript
// ✅ 推荐
<ChildComponent @item-selected="handleSelect" />

// ❌ 不推荐
<ChildComponent @itemSelected="handleSelect" />
```

### 3. 暴露组件 API

使用 `defineExpose`：

```typescript
<script setup lang="ts">
const validate = () => { /* 验证逻辑 */ }

defineExpose({
  validate
})
</script>
```

---

## 参考资源

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vue 3 Composition API](https://cn.vuejs.org/api/composition-api.html)
- [TypeScript Vue Starter](https://github.com/vuejs/create-vue)
- [Pinia 官方文档](https://pinia.vuejs.org/)
