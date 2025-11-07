# Art Design Pro 代码分离优化指南

## 📋 目录

1. [当前问题分析](#当前问题分析)
2. [优化目标](#优化目标)
3. [优化方案](#优化方案)
4. [实施步骤](#实施步骤)
5. [最佳实践](#最佳实践)
6. [示例演示](#示例演示)

---

## 当前问题分析

### 🔍 现有代码结构问题

根据对代码库的分析，发现以下问题：

1. **文件过于集中**

   - `materialStore.ts` 文件过大（36KB+）
   - `documentGenerateStore.ts` 文件过大（33KB+）
   - 单个文件承担过多职责

2. **模块耦合度高**

   - 服务层、状态层、类型定义分散在多个目录
   - 缺乏统一的模块边界
   - 修改一个功能需要跨越多个文件

3. **开发效率低**
   - 新增功能需要创建多个文件
   - 文件查找困难
   - 代码复用性差

### 📊 现状统计

```
当前结构统计:
├── 服务文件: 11个
├── Store文件: 16个 (根级 + modules)
├── 组合式函数: 16个
├── 类型定义: 20+个
└── 组件: 80+个

问题:
- 最大的Store文件: 36KB+
- 最大的Service文件: 37KB+
- 重复代码: 存在
- 模块边界: 不清晰
```

---

## 优化目标

### ✅ 短期目标

1. **文件大小标准化**

   - 单个文件不超过 200 行
   - 单个函数不超过 50 行
   - 复杂功能拆分为多个文件

2. **模块化拆分**

   - 按业务域拆分子模块
   - 每个子模块独立管理
   - 清晰的文件依赖关系

3. **提高开发效率**
   - 新增功能时最少文件数
   - 统一的开发模式
   - 最小修改影响面

### 🎯 长期目标

1. **代码复用率 > 80%**
2. **新功能开发时间减少 50%**
3. **代码可维护性提升 3 倍**
4. **新人上手时间减少 70%**

---

## 优化方案

### 🎨 1. 服务层代码分离

#### 问题

- 单个服务文件过大（如 `documentGenerateService.ts` 37KB+）
- 多个不相关的方法混在一起
- 难以维护和测试

#### 优化策略

**按领域拆分**:

```
src/services/
├── core/                    # 核心服务（基础功能）
│   ├── auth/               # 认证服务
│   │   ├── index.ts        # 统一导出
│   │   ├── login.ts        # 登录相关
│   │   ├── token.ts        # Token管理
│   │   └── permission.ts   # 权限管理
│   │
│   ├── http/               # HTTP相关
│   │   ├── interceptors/   # 拦截器
│   │   ├── utils/          # HTTP工具
│   │   └── types.ts        # HTTP类型
│   │
│   └── storage/            # 存储服务
│       ├── index.ts
│       ├── local.ts
│       ├── session.ts
│       └── indexdb.ts
│
├── modules/                # 业务模块服务
│   ├── material/           # 素材模块
│   │   ├── index.ts        # 统一导出
│   │   ├── service.ts      # 核心服务
│   │   ├── search.ts       # 搜索功能
│   │   ├── upload.ts       # 上传功能
│   │   ├── relation.ts     # 关系管理
│   │   └── mock.ts         # Mock数据
│   │
│   ├── project/            # 项目模块
│   │   ├── index.ts
│   │   ├── service.ts
│   │   ├── create.ts       # 创建项目
│   │   ├── list.ts         # 项目列表
│   │   └── detail.ts       # 项目详情
│   │
│   └── document/           # 文档模块
│       ├── index.ts
│       ├── service.ts
│       ├── outline.ts      # 大纲生成
│       ├── content.ts      # 内容生成
│       ├── agent.ts        # Agent执行
│       └── export.ts       # 文档导出
│
└── shared/                 # 共享服务
    ├── ai/                 # AI服务
    │   ├── index.ts
    │   ├── chat.ts
    │   ├── generate.ts
    │   └── types.ts
    └── utils/              # 服务工具
        ├── async.ts
        ├── cache.ts
        └── retry.ts
```

**示例代码**:

```typescript
// src/services/modules/material/index.ts
// 统一导出，方便外部使用
export { MaterialCoreService } from './service'
export { MaterialSearchService } from './search'
export { MaterialRelationService } from './relation'
export { useMaterialUpload } from './upload'
export * from './types'

// src/services/modules/material/service.ts
export class MaterialCoreService extends BaseApiService {
  protected basePath = '/materials'

  async getById(id: string): Promise<Material> {
    return this.get(`/${id}`)
  }

  async delete(id: string): Promise<void> {
    return this.delete(`/${id}`)
  }
}

// src/services/modules/material/search.ts
export class MaterialSearchService extends BaseApiService {
  protected basePath = '/materials'

  async search(params: SearchParams): Promise<Material[]> {
    return this.get('/search', params)
  }

  async advancedSearch(query: AdvancedQuery): Promise<Material[]> {
    return this.post('/search/advanced', query)
  }
}
```

### 🗄️ 2. Store 代码分离

#### 问题

- `materialStore.ts` 36KB+，职责过多
- `userStore.ts` 混合多种状态
- 难以测试和维护

#### 优化策略

**按功能拆分**:

```
src/store/
├── index.ts                # 统一导出
├── plugins/                # Pinia插件
│   ├── persist.ts
│   ├── logger.ts
│   └── devtools.ts
│
├── root/                   # 根级Store（全局状态）
│   ├── user.ts
│   ├── app.ts              # 应用状态
│   └── theme.ts
│
└── modules/                # 业务模块Store
    ├── material/           # 素材模块
    │   ├── index.ts        # 统一导出
    │   ├── state.ts        # 状态定义
    │   ├── actions.ts      # 同步/异步操作
    │   ├── getters.ts      # 计算属性
    │   ├── types.ts        # 类型定义
    │   └── persist.ts      # 持久化配置
    │
    ├── project/            # 项目模块
    │   ├── index.ts
    │   ├── state.ts
    │   ├── actions.ts
    │   ├── getters.ts
    │   └── types.ts
    │
    └── document/           # 文档模块
        ├── index.ts
        ├── state.ts
        ├── actions/
        │   ├── outline.ts
        │   ├── content.ts
        │   └── agent.ts
        ├── getters.ts
        └── types.ts
```

**示例代码**:

```typescript
// src/store/modules/material/state.ts
export interface MaterialState {
  items: Material[]
  selectedItems: Material[]
  searchQuery: string
  filters: SearchFilters
  loading: boolean
  error: string | null
}

export const initialState: MaterialState = {
  items: [],
  selectedItems: [],
  searchQuery: '',
  filters: {},
  loading: false,
  error: null
}

// src/store/modules/material/actions.ts
export const useMaterialActions = (state: MaterialState) => {
  const materialService = new MaterialService()

  const searchMaterials = async (query: string) => {
    state.loading = true
    state.error = null

    try {
      const result = await materialService.search({ query })
      state.items = result.data
    } catch (error) {
      state.error = error.message
    } finally {
      state.loading = false
    }
  }

  const selectMaterial = (material: Material) => {
    const index = state.selectedItems.findIndex((m) => m.id === material.id)
    if (index >= 0) {
      state.selectedItems.splice(index, 1)
    } else {
      state.selectedItems.push(material)
    }
  }

  return {
    searchMaterials,
    selectMaterial
  }
}

// src/store/modules/material/getters.ts
export const useMaterialGetters = (state: MaterialState) => {
  const selectedCount = computed(() => state.selectedItems.length)

  const filteredItems = computed(() => {
    // 复杂的筛选逻辑
    return state.items.filter((item) => {
      // 筛选逻辑
    })
  })

  return {
    selectedCount,
    filteredItems
  }
}

// src/store/modules/material/index.ts
import { ref, readonly } from 'vue'
import { initialState, type MaterialState } from './state'
import { useMaterialActions } from './actions'
import { useMaterialGetters } from './getters'

export const useMaterialStore = () => {
  const state = ref<MaterialState>({ ...initialState })
  const actions = useMaterialActions(state.value)
  const getters = useMaterialGetters(state.value)

  return {
    // 状态（只读）
    items: readonly(state.value.items),
    selectedItems: readonly(state.value.selectedItems),
    searchQuery: readonly(state.value.searchQuery),
    filters: readonly(state.value.filters),
    loading: readonly(state.value.loading),
    error: readonly(state.value.error),

    // Getters
    ...getters,

    // Actions
    ...actions
  }
}
```

### 📝 3. 类型定义分离

#### 问题

- 类型定义分散在多个文件
- 相关类型未集中管理
- 难以查找和维护

#### 优化策略

**按业务域管理**:

```
src/types/
├── index.ts                # 统一导出
│
├── api/                    # API相关类型
│   ├── request.ts
│   ├── response.ts
│   └── common.ts
│
├── business/               # 业务类型
│   ├── material/           # 素材类型
│   │   ├── index.ts
│   │   ├── entity.ts       # 实体类型
│   │   ├── dto.ts          # 传输对象
│   │   ├── vo.ts           # 视图对象
│   │   ├── enums.ts        # 枚举
│   │   └── relations.ts    # 关系类型
│   │
│   ├── project/            # 项目类型
│   │   ├── index.ts
│   │   ├── entity.ts
│   │   ├── dto.ts
│   │   └── vo.ts
│   │
│   └── document/           # 文档类型
│       ├── index.ts
│       ├── entity.ts
│       ├── dto.ts
│       ├── outline.ts      # 大纲相关
│       ├── content.ts      # 内容相关
│       └── agent.ts        # Agent相关
│
├── components/             # 组件类型
│   ├── props.ts
│   ├── emits.ts
│   └── expose.ts
│
└── utils/                  # 工具类型
    ├── helper.ts
    └── validator.ts
```

**示例代码**:

```typescript
// src/types/business/material/entity.ts
export interface Material {
  id: string
  title: string
  description: string
  url: string
  thumbnail: string
  type: MaterialType
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export enum MaterialType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO'
}

// src/types/business/material/dto.ts
export interface CreateMaterialDto {
  title: string
  description: string
  file: File
  type: MaterialType
  tags: string[]
}

export interface UpdateMaterialDto {
  id: string
  title?: string
  description?: string
  tags?: string[]
}

// src/types/business/material/vo.ts
export interface MaterialListVo {
  items: Material[]
  total: number
  page: number
  pageSize: number
}

export interface MaterialSearchVo {
  items: Material[]
  facets: SearchFacet[]
  suggestions: string[]
}

// src/types/business/material/index.ts
// 统一导出
export * from './entity'
export * from './dto'
export * from './vo'
export * from './enums'
export * from './relations'
```

### 🎨 4. 组合式函数分离

#### 问题

- 组合式函数职责不单一
- 多个不相关功能混在一起
- 难以复用

#### 优化策略

**按功能拆分**:

```
src/composables/
├── useXxx.ts               # 基础组合式函数
│
├── material/               # 素材相关
│   ├── index.ts            # 统一导出
│   ├── useSearch.ts        # 搜索功能
│   ├── useUpload.ts        # 上传功能
│   ├── useSelect.ts        # 选择功能
│   ├── useFilter.ts        # 筛选功能
│   └── useSort.ts          # 排序功能
│
├── project/                # 项目相关
│   ├── index.ts
│   ├── useCreate.ts        # 创建项目
│   ├── useList.ts          # 项目列表
│   └── useDetail.ts        # 项目详情
│
└── document/               # 文档相关
    ├── index.ts
    ├── useOutline.ts       # 大纲管理
    ├── useContent.ts       # 内容管理
    ├── useAgent.ts         # Agent执行
    └── useExport.ts        # 文档导出
```

**示例代码**:

```typescript
// src/composables/material/useSearch.ts
export const useMaterialSearch = () => {
  const searchQuery = ref('')
  const results = ref<Material[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const materialService = new MaterialService()

  const search = async (query: string) => {
    searchQuery.value = query
    loading.value = true
    error.value = null

    try {
      const result = await materialService.search({ query })
      results.value = result.data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    searchQuery: readonly(searchQuery),
    results: readonly(results),
    loading: readonly(loading),
    error: readonly(error),
    search
  }
}

// src/composables/material/useSelect.ts
export const useMaterialSelect = () => {
  const selected = ref<Material[]>([])

  const select = (material: Material) => {
    const index = selected.value.findIndex((m) => m.id === material.id)
    if (index >= 0) {
      selected.value.splice(index, 1)
    } else {
      selected.value.push(material)
    }
  }

  const clear = () => {
    selected.value = []
  }

  const isSelected = (material: Material) => {
    return selected.value.some((m) => m.id === material.id)
  }

  return {
    selected: readonly(selected),
    select,
    clear,
    isSelected
  }
}

// src/composables/material/index.ts
export { useMaterialSearch } from './useSearch'
export { useMaterialSelect } from './useSelect'
export { useMaterialUpload } from './useUpload'
export { useMaterialFilter } from './useFilter'
export { useMaterialSort } from './useSort'
```

### 🔧 5. 工具函数分离

#### 问题

- 工具函数混合在少数几个文件中
- 功能相关但组织混乱
- 难以按需引入

#### 优化策略

**按用途分组**:

```
src/utils/
├── common/                 # 通用工具
│   ├── index.ts
│   ├── format.ts
│   ├── transform.ts
│   ├── validate.ts
│   ├── debounce.ts
│   └── throttle.ts
│
├── browser/                # 浏览器相关
│   ├── index.ts
│   ├── cookie.ts
│   ├── storage.ts
│   ├── clipboard.ts
│   └── fullscreen.ts
│
├── date/                   # 日期工具
│   ├── index.ts
│   ├── format.ts
│   ├── parse.ts
│   ├── compare.ts
│   └── diff.ts
│
├── string/                 # 字符串工具
│   ├── index.ts
│   ├── format.ts
│   ├── validate.ts
│   ├── escape.ts
│   └── random.ts
│
├── number/                 # 数值工具
│   ├── index.ts
│   ├── format.ts
│   ├── validate.ts
│   ├── random.ts
│   └── calculate.ts
│
└── array/                  # 数组工具
    ├── index.ts
    ├── sort.ts
    ├── filter.ts
    ├── find.ts
    └── manipulate.ts
```

**示例代码**:

```typescript
// src/utils/date/format.ts
export const formatDate = (date: Date, format = 'YYYY-MM-DD'): string => {
  // 格式化逻辑
}

export const formatDateTime = (date: Date): string => {
  // 格式化逻辑
}

export const formatRelative = (date: Date): string => {
  // 相对时间
}

// src/utils/date/index.ts
export * from './format'
export * from './parse'
export * from './compare'
export * from './diff'

// 使用方式
import { formatDate, formatRelative } from '@/utils/date'
```

---

## 实施步骤

### 📅 第一阶段：规划与准备

1. **创建新的目录结构**

```bash
# 创建目录结构
mkdir -p src/services/modules/material
mkdir -p src/store/modules/material
mkdir -p src/types/business/material
mkdir -p src/composables/material
```

2. **定义拆分规范**
   - 文件大小限制：200行
   - 函数大小限制：50行
   - 单职责原则
   - 依赖关系清晰

### 📅 第二阶段：服务层拆分

1. **优先级顺序**:

   - `documentGenerateService.ts` (37KB)
   - `materialService.ts` (16KB)
   - `projectService.ts` (22KB)
   - `searchService.ts` (13KB)

2. **拆分步骤**:

   - 第一步：创建子目录
   - 第二步：按功能拆分
   - 第三步：创建统一导出
   - 第四步：更新引用

3. **验证**:
   - 运行测试
   - 检查构建
   - 验证功能

### 📅 第三阶段：Store 拆分

1. **优先级顺序**:

   - `materialStore.ts` (36KB)
   - `documentGenerateStore.ts` (33KB)
   - `userStore.ts` (15KB)

2. **拆分步骤**:
   - 提取状态定义
   - 分离操作方法
   - 提取计算属性
   - 创建统一导出

### 📅 第四阶段：类型定义整理

1. **按业务域分类**
2. **创建统一导出**
3. **更新所有引用**

### 📅 第五阶段：测试与优化

1. **运行所有测试**
2. **检查构建产物**
3. **性能测试**
4. **代码审查**

---

## 最佳实践

### ✅ DO - 这样做

1. **保持单一职责**

```typescript
// ✅ 好的实践
export const useMaterialSearch = () => {
  // 只负责搜索
}
```

2. **使用统一导出**

```typescript
// src/services/modules/material/index.ts
export * from './service'
export * from './search'
export * from './relation'
```

3. **清晰的依赖关系**

```typescript
// 明确依赖
import { MaterialService } from '@/services/modules/material'
```

4. **小而精的文件**

```typescript
// ✅ 一个文件一个功能
// materialSearch.ts - 搜索功能
// materialUpload.ts - 上传功能
// materialFilter.ts - 筛选功能
```

### ❌ DON'T - 不要这样做

1. **不要混合功能**

```typescript
// ❌ 差的实践
export const useMaterialStore = () => {
  // 搜索 + 上传 + 筛选 + 排序 + 删除 + 创建
  // 全部混在一起
}
```

2. **不要创建上帝文件**

```typescript
// ❌ 差的实践
// 一个文件3000行，包含所有功能
```

3. **不要跳过抽象**

```typescript
// ❌ 差的实践
// 直接操作HTTP，没有服务层
```

4. **不要忽略类型**

```typescript
// ❌ 差的实践
// 使用 any，没有类型定义
```

---

## 示例演示

### 🎯 示例 1: 新增一个功能 - 素材收藏

**传统方式**（需要 5+ 个文件）:

```
1. materialService.ts - 添加收藏方法
2. materialStore.ts - 添加收藏状态和方法
3. useMaterialSearch.ts - 更新搜索组合式函数
4. material.ts - 更新类型定义
5. MaterialCard.vue - 更新UI组件
6. MaterialCollectionView.vue - 创建新页面
```

**优化后方式**（需要 3 个文件）:

```
1. src/services/modules/material/favorite.ts
   - 创建收藏服务

2. src/store/modules/material/favorite.ts
   - 创建收藏状态

3. src/components/custom/material/MaterialFavoriteButton.vue
   - 创建收藏按钮组件
```

**代码示例**:

```typescript
// 1. src/services/modules/material/favorite.ts
export class MaterialFavoriteService extends BaseApiService {
  async addToFavorite(materialId: string): Promise<void> {
    return this.post('/favorites', { materialId })
  }

  async removeFromFavorite(materialId: string): Promise<void> {
    return this.delete(`/favorites/${materialId}`)
  }

  async getFavorites(): Promise<Material[]> {
    return this.get('/favorites')
  }
}

// 2. src/store/modules/material/favorite.ts
export const useMaterialFavorite = () => {
  const favorites = ref<string[]>([])
  const loading = ref(false)

  const favoriteService = new MaterialFavoriteService()

  const add = async (materialId: string) => {
    loading.value = true
    try {
      await favoriteService.addToFavorite(materialId)
      favorites.value.push(materialId)
    } finally {
      loading.value = false
    }
  }

  const remove = async (materialId: string) => {
    loading.value = true
    try {
      await favoriteService.removeFromFavorite(materialId)
      const index = favorites.value.indexOf(materialId)
      if (index >= 0) {
        favorites.value.splice(index, 1)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    favorites: readonly(favorites),
    loading: readonly(loading),
    add,
    remove
  }
}

// 3. src/components/custom/material/MaterialFavoriteButton.vue
<template>
  <el-button
    :type="isFavorite ? 'warning' : 'default'"
    :loading="loading"
    @click="toggleFavorite"
  >
    <el-icon v-if="isFavorite"><StarFilled /></el-icon>
    <el-icon v-else><Star /></el-icon>
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMaterialFavorite } from '@/store/modules/material/favorite'

interface Props {
  materialId: string
}

const props = defineProps<Props>()

const { favorites, loading, add, remove } = useMaterialFavorite()
const isFavorite = computed(() => favorites.value.includes(props.materialId))

const toggleFavorite = () => {
  if (isFavorite.value) {
    remove(props.materialId)
  } else {
    add(props.materialId)
  }
}
</script>
```

### 🎯 示例 2: 查找相关代码

**优化前**:

```
查找"搜索素材"功能:
- materialService.ts (搜索方法)
- materialStore.ts (搜索状态)
- useMaterialSearch.ts (搜索组合式)
- MaterialSearch.vue (搜索组件)
- MaterialSearchView.vue (搜索页面)
- 可能在多个其他文件也有搜索逻辑

需要搜索多个文件
```

**优化后**:

```
查找"搜索素材"功能:
- src/services/modules/material/search.ts - 搜索API
- src/store/modules/material/search.ts - 搜索状态
- src/composables/material/useSearch.ts - 搜索逻辑
- src/components/custom/material/MaterialSearch.vue - 搜索组件

所有相关代码都在 material 目录下
按功能清晰分组
```

---

## 预期效果

### 📈 量化指标

| 指标             | 优化前 | 优化后 | 提升    |
| ---------------- | ------ | ------ | ------- |
| 单个文件最大行数 | 800+   | 200    | ⬇️ 75%  |
| 搜索功能文件数   | 10+    | 3      | ⬇️ 70%  |
| 新功能开发文件数 | 8-10   | 3-5    | ⬇️ 60%  |
| 代码复用率       | 40%    | 80%    | ⬆️ 100% |
| 新人上手时间     | 2周    | 3天    | ⬇️ 85%  |

### 🎉 非量化收益

1. **开发体验提升**

   - 文件查找更快
   - 代码结构更清晰
   - 修改影响面更小

2. **维护性提升**

   - Bug定位更快
   - 功能测试更容易
   - 重构风险更低

3. **团队协作提升**
   - 冲突更少
   - 代码审查更快
   - 知识传递更容易

---

## 总结

通过代码分离优化，我们将实现：

✅ **文件更小**: 单个文件不超过200行✅ **职责单一**: 每个文件只负责一个功能 ✅ **结构清晰**: 按业务域组织代码 ✅ **开发更快**: 新功能需要更少文件 ✅ **维护更容易**: 修改影响面更小 ✅ **复用性更高**: 代码可复用率提升100%

**下一步行动**:

1. 按优先级拆分大文件
2. 创建统一的导出文件
3. 更新所有引用路径
4. 运行测试确保功能正常
5. 文档化新的开发模式

---

**维护者**: 开发团队 **最后更新**: 2025-11-07 **版本**: v1.0.0
