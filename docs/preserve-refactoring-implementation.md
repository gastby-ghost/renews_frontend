# 保留原文件的页面重构实施指南

## 📋 核心原则

- ✅ **零风险**: 原有文件完全保留，随时可以回滚
- ✅ **v2页面优先**: 先创建v2版本页面，确保能正常显示和访问，再逐步添加组件
- ✅ **渐进实现**: 逐个组件实现，每步都要验证功能正确
- ✅ **并行开发**: 新旧版本并存，支持A/B测试
- ✅ **灵活切换**: 支持多种版本切换方式

## 🎯 总体策略：v2页面优先，组件逐步添加

### 核心理念

**先有页面，再有组件！** 这是一个关键理念转变：

1. **第一步**: 创建最基础的v2页面（仅包含基本结构和占位内容）
2. **第二步**: 让v2页面能在前端正常访问和显示
3. **第三步**: 在v2页面内逐步添加拆分后的组件
4. **第四步**: 验证每个组件的功能正确性

这种策略的优势：

- 页面框架先行，降低重构风险
- 早期验证路由和导航配置
- 组件添加过程可逆，便于调试
- 便于团队协作，分模块开发

---

## 🚀 第一阶段：创建v2基础页面

### 页面目录结构设计

```
src/views/document-generation/
├── topic-selection/
│   ├── index.vue                    # 原有文件保留 ✅
│   └── v2/                          # 新版本目录
│       ├── index.vue               # v2主页面 - 最简单版本
│       ├── components/             # 拆分后的组件目录
│       │   ├── RequirementsSection.vue
│       │   ├── TitleGenerationControls.vue
│       │   ├── TitleGenerationActions.vue
│       │   ├── TitleDisplaySection.vue
│       │   ├── TitleMaterialsSection.vue
│       │   └── TaskStatusSection.vue
│       └── composables/            # v2页面专用组合式函数
├── outline/
│   ├── index.vue                   # 原有文件保留 ✅
│   ├── TitleSection.vue            # 原有文件保留 ✅
│   ├── OutlineEditorSection.vue    # 原有文件保留 ✅
│   └── v2/                        # 新版本目录
│       ├── index.vue              # v2主页面
│       └── components/            # 拆分后的组件
│           ├── SelectedTitleDisplay.vue
│           ├── RelatedMaterialsManager.vue
│           ├── TitleEmptyState.vue
│           ├── AIFunctionPanel.vue
│           ├── OutlineEmptyState.vue
│           ├── OutlineTreeEditor.vue
│           └── SectionDetailEditor.vue
└── content/
    ├── index.vue                   # 原有文件保留 ✅
    └── v2/                        # 新版本目录
        ├── index.vue              # v2主页面
        └── components/            # 拆分后的组件
            ├── HeaderSection.vue
            ├── OutlinePanel.vue
            ├── EditorPanel.vue
            ├── StatsPanel.vue
            └── AIDialog.vue

src/views/material/
├── management/
│   ├── index.vue                  # 原有文件保留 ✅
│   └── v2/                       # 新版本目录
│       ├── index.vue             # v2主页面
│       └── components/
│           ├── MaterialFilter.vue
│           └── MaterialBatchActions.vue
```

### 步骤1：创建v2主页面（最小可行版本）

#### 1.1 最简单的v2页面模板

**目标**: 创建一个能正常显示的v2页面，不需要包含任何复杂逻辑

**topic-selection/v2/index.vue 示例**:

```vue
<template>
  <div class="topic-selection-v2">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>选题策划 (v2)</h1>
      <el-tag type="warning">重构版本</el-tag>
    </div>

    <!-- 占位内容 -->
    <div class="placeholder-content">
      <el-empty description="v2页面正在开发中...">
        <el-button type="primary" @click="goToV1"> 切换到v1版本 </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const goToV1 = () => {
    router.push('/document-generation/topic-selection')
  }
</script>

<style scoped>
  .topic-selection-v2 {
    padding: 24px;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .placeholder-content {
    padding: 60px 0;
  }
</style>
```

**关键要点**:

- 页面结构简单清晰
- 显示v2版本标识
- 提供返回v1的按钮
- 不依赖任何复杂逻辑

#### 1.2 其他页面的v2最小版本

类似地，为其他页面创建最小v2版本：

- `outline/v2/index.vue` - 大纲页面最小版本
- `content/v2/index.vue` - 正文页面最小版本
- `material/management/v2/index.vue` - 素材管理最小版本

### 步骤2：添加v2路由配置

#### 2.1 更新路由配置

在 `src/router/routes/asyncRoutes.ts` 中添加v2路由：

```typescript
// 添加v2版本路由（与原路由平行）
{
  path: '/document-generation/topic-selection-v2',
  name: 'DocumentTopicSelectionV2',
  component: () => import('@/views/document-generation/topic-selection/v2/index.vue'),
  meta: {
    title: '选题策划 (v2)',
    keepAlive: true,
    isHide: true,
    activePath: '/document-generation/project-list',
    version: 'v2'
  }
},
{
  path: '/document-generation/outline-v2/:projectId',
  name: 'DocumentOutlineV2',
  component: () => import('@/views/document-generation/outline/v2/index.vue'),
  meta: {
    title: '大纲 (v2)',
    keepAlive: true,
    isHide: true,
    activePath: '/document-generation/project-list',
    version: 'v2'
  }
},
{
  path: '/document-generation/content-v2/:projectId',
  name: 'DocumentContentV2',
  component: () => import('@/views/document-generation/content/v2/index.vue'),
  meta: {
    title: '正文 (v2)',
    keepAlive: true,
    isHide: true,
    activePath: '/document-generation/project-list',
    version: 'v2'
  }
},
{
  path: '/material/management-v2',
  name: 'MaterialManagementV2',
  component: () => import('@/views/material/management/v2/index.vue'),
  meta: {
    title: '素材管理 (v2)',
    keepAlive: true,
    version: 'v2'
  }
}
```

#### 2.2 添加版本切换按钮

在v1页面中添加切换到v2的按钮：

```vue
<!-- 在原页面添加版本切换 -->
<template>
  <div class="original-page">
    <!-- 原页面内容... -->

    <!-- 版本切换按钮 -->
    <div class="version-switcher">
      <el-divider>版本切换</el-divider>
      <el-button @click="switchToV2" type="primary" plain> 体验v2版本 (开发中) </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()

  const switchToV2 = () => {
    // 根据当前路径决定v2路径
    const currentPath = router.currentRoute.value.path
    const v2Path = currentPath.replace('/topic-selection', '/topic-selection-v2')
    router.push(v2Path)
  }
</script>
```

### 步骤3：验证v2页面显示

#### 验证清单

- [ ] v2页面路由可以正常访问
- [ ] 页面显示正确的v2标识
- [ ] 可以在v1和v2之间正常切换
- [ ] 导航菜单显示v2版本选项
- [ ] 浏览器前进/后退功能正常
