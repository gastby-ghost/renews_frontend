# Document Generation 功能与Service映射

## 文档生成流程分析总结

### 数据流动过程

#### 1. 选题策划阶段 (topic-selection)

**数据流路径：**

```
View (topic-selection/index.vue)
  ↓
Composable (useTopicSelection.ts)
  ↓
Store (documentGenerateStore + projectStore)
  ↓
Service (ScopeAgent, Search2TitleAgent)
  ↓
API (后端AI服务)
  ↓
数据库 (research_briefs, titles, search_results)
```

**关键数据状态：**

- `requirementsState.form` - 表单数据（主题、关键要点、特殊要求）
- `documentState.researchBrief` - AI生成的研究简报
- `documentState.generatedTitles` - 生成的标题列表
- `documentState.selectedTitle` - 选中的标题
- `documentState.titleSearchResults` - 标题相关的搜索结果

**核心功能：**

1. 需求定义表单管理
2. AI简报生成（ScopeAgent）
3. 标题生成（Search2TitleAgent）
4. 素材搜索和选择
5. 状态持久化（localStorage + 数据库）

#### 2. 大纲编辑阶段 (outline)

**数据流路径：**

```
View (outline/index.vue + TitleSection + OutlineEditorSection)
  ↓
Composable (useOutlinePage.ts)
  ↓
Store (outlineStore + outlineSectionStore + materialRelationStore + documentGenerateStore)
  ↓
Service (OutlineGenerate, MaterialBind, OutlineSection)
  ↓
API (后端AI服务 + 数据库API)
  ↓
数据库 (outlines, outline_sections, material_relations)
```

**关键数据状态：**

- `state.generatedOutline` - 本地生成的AI大纲
- `sectionStore.sections` - 数据库中的章节列表
- `documentState.generatedOutline` - store中的大纲副本
- `selectedMaterials` - 用户选择的素材列表

**核心功能：**

1. AI大纲生成（基于标题和素材）
2. 手动章节编辑（增删改查）
3. 素材绑定（AI自动绑定 + 手动绑定）
4. 大纲验证和导出
5. 真实数据库操作（outline_sections表）

#### 3. 正文编辑阶段 (content)

**数据流路径：**

```
View (content/index.vue + HeaderSection + EditorPanel + OutlinePanel + StatsPanel)
  ↓
Composable (useContent.ts)
  ↓
Store (documentGenerateStore + projectStore)
  ↓
Service (bodyService)
  ↓
API (后端数据库API)
  ↓
数据库 (document_bodies)
```

**关键数据状态：**

- `state.content` - Markdown文档内容
- `state.outline` - 从内容解析的章节结构
- `stats` - 文档统计信息（字数、可读性等）

**核心功能：**

1. Markdown文档编辑
2. 实时大纲生成
3. 文档统计和分析
4. AI辅助功能（润色、扩写、总结、翻译、改写）
5. 文档保存和导出

## 功能列表与Service映射

### 一、选题策划功能

| 功能名称 | 页面/组件 | Composable | Store | Service | API端点 |
| --- | --- | --- | --- | --- | --- |
| 需求定义表单 | topic-selection/index.vue | useTopicSelection | documentGenerateStore | - | - |
| AI简报生成 | topic-selection/index.vue | useTopicSelection | documentGenerateStore | scopeAgentService | POST /api/scope-agent |
| 研究简报编辑 | 简报编辑对话框 | useTopicSelection | documentGenerateStore | - | - |
| 标题搜索 | MaterialSelectionForTitle.vue | - | - | searchAgentService | POST /api/search |
| 标题生成 | topic-selection/index.vue | useTopicSelection | documentGenerateStore | search2titleAgentService | POST /api/search2title |
| 标题选择 | TitleCard.vue | useTopicSelection | documentGenerateStore | - | - |
| 搜索结果管理 | topic-selection/index.vue | useTopicSelection | documentGenerateStore | - | - |
| 状态持久化 | topic-selection/index.vue | useTopicSelection | documentGenerateStore | databaseSyncService | 多API |

**使用的Service详细说明：**

1. **scopeAgentService**

   - 作用：基于需求生成研究简报
   - 方法：`executeScopeAgent(userId, projectId, query)`
   - 轮询：`getTaskStatus(taskId)`

2. **searchAgentService**

   - 作用：搜索相关素材
   - 方法：`searchMaterials(query, filters)`

3. **search2titleAgentService**

   - 作用：基于研究简报生成标题
   - 方法：`executeSearch2Title(userId, projectId, brief)`
   - 轮询：`getTaskStatus(taskId)`

4. **databaseSyncService**
   - 作用：AI任务完成后同步数据到数据库
   - 方法：`syncScopeAgentResult()`, `syncSearch2TitleResult()`

### 二、大纲编辑功能

| 功能名称 | 页面/组件 | Composable | Store | Service | 数据库表 |
| --- | --- | --- | --- | --- | --- |
| 大纲展示 | OutlineEditorSection.vue | useOutlinePage | outlineStore | outlineService | outlines |
| 章节管理 | OutlineEditorSection.vue | useOutlinePage | outlineSectionStore | outlineSectionService | outline_sections |
| AI大纲生成 | OutlineEditorSection.vue | useOutlinePage | documentGenerateStore | outlineGenerateService | - |
| AI完整生成 | OutlineEditorSection.vue | useOutlinePage | documentGenerateStore | outlineWithMaterialService | - |
| 素材绑定 | OutlineEditorSection.vue | useOutlinePage | materialRelationStore | materialRelationService | material_relations |
| AI素材绑定 | OutlineEditorSection.vue | useOutlinePage | materialBindStore | materialBindService | material_relations |
| 章节拖拽排序 | OutlineEditorSection.vue | useOutlinePage | outlineSectionStore | outlineSectionService | outline_sections |
| 大纲导出 | OutlineEditorSection.vue | useOutlinePage | - | - | - |

**使用的Service详细说明：**

1. **outlineService**

   - 作用：大纲基础操作
   - 方法：`fetchActiveOutline()`, `createOutline()`, `activateOutline()`

2. **outlineSectionService**

   - 作用：章节CRUD操作
   - 方法：`createSection()`, `updateSection()`, `deleteSection()`, `batchCreateSections()`

3. **outlineGenerateService**

   - 作用：AI生成大纲
   - 方法：`generateOutline(title, brief, materials)`

4. **outlineWithMaterialService**

   - 作用：AI生成大纲并自动绑定素材
   - 方法：`executeOutlineWithMaterialWithPolling()`

5. **materialRelationService**

   - 作用：素材章节关系管理
   - 方法：`bindMaterialToSection()`, `unbindMaterialFromSection()`

6. **materialBindService**
   - 作用：AI智能绑定素材
   - 方法：`executeMaterialBind()`

### 三、正文编辑功能

| 功能名称     | 页面/组件         | Composable | Store        | Service        | 数据库表        |
| ------------ | ----------------- | ---------- | ------------ | -------------- | --------------- |
| Markdown编辑 | EditorPanel.vue   | useContent | -            | -              | -               |
| 实时大纲     | EditorPanel.vue   | useContent | -            | -              | -               |
| 内容统计     | StatsPanel.vue    | useContent | -            | -              | -               |
| AI润色       | AIDialog.vue      | useContent | -            | -              | -               |
| 文档保存     | useContent        | useContent | -            | bodyService    | document_bodies |
| 文档导出     | EditorPanel.vue   | useContent | -            | -              | -               |
| 项目信息     | HeaderSection.vue | useContent | projectStore | projectService | projects        |

**使用的Service详细说明：**

1. **bodyService**
   - 作用：正文内容管理
   - 方法：`createBody()`, `updateBody()`, `getActiveBody()`

### 四、通用功能

| 功能名称 | 页面/组件 | Composable | Store | Service | 说明 |
| --- | --- | --- | --- | --- | --- |
| 项目管理 | 多个页面 | - | projectStore | projectService | 项目基础信息管理 |
| 用户认证 | 多个页面 | - | - | authService | 用户登录状态管理 |
| 素材库 | MaterialLibraryDialog.vue | - | - | materialApiService | 素材CRUD操作 |
| 系统配置 | 多个页面 | - | - | systemPreferencesService | 系统设置 |

## 数据流总结图

```
选题策划
User Input → Form → ScopeAgent → Research Brief → Search2Title → Titles → Search Results

         ↓ (持久化到数据库)
         databaseSyncService

大纲编辑
Title + Materials → OutlineWithMaterial → AI Outline → Material Binding
    ↓
Outline Sections (数据库) + Generated Outline (本地)
    ↓
手动编辑 (增删改查)

正文编辑
Outline → Content Editor → Markdown → Stats Analysis
    ↓
Body Service (保存到数据库)
```

## 状态管理架构

### 当前问题

1. **Store职责混乱** - 同时处理状态存储和业务逻辑
2. **Composables耦合度高** - 直接操作多个Store
3. **Service调用分散** - 在Composables和Store中都有调用
4. **数据流不清晰** - 状态变化路径复杂

### 解决方案

采用**Store-Composable-View**三层架构：

- **Store** - 仅负责状态存储和基础状态操作
- **Composable** - 负责业务逻辑和数据处理，调用Service
- **View** - 负责UI展示和用户交互
- **Service** - 负责API调用和数据访问

详细架构方案见后续文件。
