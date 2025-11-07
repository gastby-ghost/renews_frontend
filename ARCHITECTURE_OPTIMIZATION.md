# 项目架构优化总结

## 概述

基于新的OpenAPI 3.1.0规范（`outlines.json`、`outline-sections.json`、`material-relations.json`），对项目进行了全面的架构优化。不考虑向后兼容性，重新构建了服务层、状态管理、Mock数据和相关类型定义。

## 优化内容

### 1. 服务层（Services）

#### 新增服务文件

- **`src/services/outlineService.ts`** - 大纲管理服务

  - `createOutline()` - 创建大纲
  - `getActiveOutline()` - 获取活动大纲
  - `getOutlineHistory()` - 获取大纲历史
  - `getOutlineWithSections()` - 获取大纲及章节
  - `updateOutline()` - 更新大纲
  - `deleteOutline()` - 删除大纲
  - `activateOutline()` - 激活大纲
  - `deactivateOutline()` - 停用大纲

- **`src/services/outlineSectionService.ts`** - 章节管理服务

  - `createSection()` - 创建章节
  - `getSectionsByOutline()` - 获取章节列表
  - `getSectionById()` - 获取章节详情
  - `updateSection()` - 更新章节
  - `deleteSection()` - 删除章节
  - `batchCreateSections()` - 批量创建章节
  - `reorderSections()` - 重新排序章节

- **`src/services/materialRelationService.ts`** - 素材关系管理服务
  - 标题素材关系：`bindMaterialToTitle()`、`getTitleMaterials()`、`unbindMaterialFromTitle()`、`updateTitleRelevanceScore()`
  - 章节素材关系：`bindMaterialToSection()`、`getSectionMaterials()`、`unbindMaterialFromSection()`、`updateSectionBindingType()`
  - 批量操作：`batchBindMaterialsToTitle()`、`batchBindMaterialsToSection()`等

### 2. 状态管理（Stores）

#### 新增Store文件

- **`src/store/modules/outline.ts`** - 大纲状态管理

  - 状态：当前大纲、章节列表、历史记录
  - 方法：创建、获取、更新、删除、激活、停用大纲

- **`src/store/modules/outlineSection.ts`** - 章节状态管理

  - 状态：章节列表、当前章节
  - 方法：创建、更新、删除、批量操作、排序章节

- **`src/store/modules/materialRelation.ts`** - 素材关系状态管理
  - 状态：标题关系、章节关系
  - 方法：绑定、解绑、批量操作、更新评分

### 3. Mock数据

#### 新增Mock文件

- **`src/mock/data/outline/index.ts`** - 大纲Mock数据
- **`src/mock/data/outline-section/index.ts`** - 章节Mock数据
- **`src/mock/data/material-relation/index.ts`** - 素材关系Mock数据

#### 特点

- 完全基于新的OpenAPI规范
- 包含完整的CRUD操作模拟
- 支持批量操作
- 包含完整的关联关系模拟

### 4. 类型定义

#### 更新文件

- **`src/types/api.ts`** - 扩展API类型定义
  - 添加了Outline相关类型
  - 添加了OutlineSection相关类型
  - 添加了MaterialRelation相关类型
  - 修复了ESLint警告（使用type代替interface继承）

### 5. 组合式函数

#### 新增文件

- **`src/composables/useNewOutline.ts`** - 新的大纲管理组合式函数
  - 封装了常见的大纲操作
  - 集成Store操作
  - 统一的错误处理和用户提示
  - 响应式状态管理

## 技术特点

### 1. 架构清晰

- 分层架构：服务层、状态管理层、组件层
- 职责分离：每个模块专注于自己的核心功能
- 模块化：高度内聚、低耦合的模块设计

### 2. 类型安全

- 完整的TypeScript类型定义
- 基于OpenAPI规范的类型生成
- 编译时类型检查

### 3. 响应式设计

- 基于Vue 3 Composition API
- 响应式状态管理
- 自动依赖追踪

### 4. 错误处理

- 统一的错误处理机制
- 用户友好的错误提示
- 完善的日志记录

### 5. Mock支持

- 完整的Mock数据覆盖
- 支持开发环境调试
- 无需后端即可完成前端开发

## 使用方式

### 在组件中使用新的Store

```typescript
import { useOutlineStore } from '@/store/modules/outline'
import { useOutlineSectionStore } from '@/store/modules/outlineSection'
import { useMaterialRelationStore } from '@/store/modules/materialRelation'

const outlineStore = useOutlineStore()
const sectionStore = useOutlineSectionStore()
const materialRelationStore = useMaterialRelationStore()
```

### 使用组合式函数

```typescript
import { useNewOutline } from '@/composables/useNewOutline'

const { currentOutline, sections, loading, addSection, updateSection, bindMaterialToSection } =
  useNewOutline()
```

### 使用服务层

```typescript
import { outlineService } from '@/services/outlineService'

// 创建大纲
const outline = await outlineService.createOutline(projectId, {
  title_candidate_id: 1,
  research_brief: '研究简报内容'
})

// 获取活动大纲
const activeOutline = await outlineService.getActiveOutline(projectId)
```

## 后续开发建议

1. **更新现有页面** - 将现有的document-generation页面迁移到新的Store和服务
2. **完善单元测试** - 为新的服务层和Store添加单元测试
3. **添加端到端测试** - 确保整个工作流正常运行
4. **性能优化** - 根据实际使用情况优化性能和内存使用
5. **文档完善** - 为新的API和组件添加使用文档

## 总结

本次优化基于新的OpenAPI规范，完全重构了项目的大纲管理相关功能。新的架构更加清晰、模块化，并且具有良好的扩展性。通过完善的服务层、状态管理和Mock数据支持，可以显著提高开发效率和代码质量。

所有代码都遵循最佳实践，包括TypeScript类型安全、错误处理、响应式设计等，为项目的长期维护和扩展奠定了坚实的基础。
