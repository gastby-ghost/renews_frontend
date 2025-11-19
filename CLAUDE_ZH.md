# CLAUDE_ZH.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供中文指导。

## 文件同步要求

⚠️ **重要提醒**：每次更新此文件时，**必须同步更新** `CLAUDE.md` 文件，确保两个文件的内容保持一致和最新。

## 设计优先开发理念

⚠️ **关键提示**：构建新页面或功能时，**始终从设计开始**并**首先考虑现有组件**。本项目强调组件优先的方法，以确保一致性、可维护性和效率。

### 设计优先工作流程

1. **需求分析** - 理解需要构建什么
2. **组件研究** - 首先研究 `COMPONENT_LIBRARY.md` 中的现有组件
3. **基于组件的设计** - 在创建新组件之前，使用可用组件设计页面
4. **布局规划** - 使用现有布局组件构建页面结构
5. **组件组合** - 组合现有组件以创建新功能
6. **仅在必要时创建新组件** - 仅当现有组件无法满足需求时才构建新组件

### 组件优先原则

- **重用优于创建**：始终优先使用现有组件而不是创建新组件
- **组合优于定制**：组合现有组件而不是大量定制
- **一致性优于独特性**：在整个应用程序中保持设计一致性
- **效率优于新颖性**：使用经过验证的组件高效构建

## 核心开发命令

**开发与构建：**

- `pnpm dev` - 启动开发服务器，支持热重载和自动打开浏览器
- `pnpm build` - 构建生产版本，包含 TypeScript 编译
- `pnpm serve` - 本地预览生产版本

**代码质量：**

- `pnpm lint` - 运行 ESLint 进行代码质量检查
- `pnpm fix` - 自动修复 ESLint 问题
- `pnpm lint:prettier` - 使用 Prettier 格式化所有文件类型
- `pnpm lint:stylelint` - 修复 SCSS/CSS 样式问题
- `pnpm lint:lint-staged` - 运行 lint-staged 进行预提交检查

**开发工具：**

- `pnpm commit` - 使用 git-cz (Commitizen) 进行交互式提交
- `pnpm clean:dev` - 清理开发缓存和临时文件
- `pnpm prepare` - 设置 Husky git 钩子

**API 和代码生成：**

- `pnpm generate:api:core` - 从 OpenAPI 规范生成核心服务类型和接口
- `pnpm generate:api:ai` - 生成 AI 服务相关类型定义

## 高级功能系统

### 素材库与 AI 搜索

- **AI 增强搜索**：集成 DeepSeek 实现智能素材搜索
- **搜索进度可视化**：实时搜索进度组件
- **素材卡片系统**：统一的素材展示与批量管理
- **API 集成**：`@ai_api/search-tools` 提供高级搜索功能

### AI 文档生成

- **5 步工作流程**：项目列表 → 需求 → 标题 → 大纲 → 内容
- **AI 集成**：完整的 AI 驱动文档创建，支持 localStorage 持久化
- **富文本编辑**：集成 WangEditor 与 AI 建议
- **状态管理**：Vue 3 响应式系统，支持项目特定存储

### API 管理系统

- **集中化配置**：所有 API 在 `src/config/api/index.ts` 中管理
- **模拟/真实 API 切换**：运行时 API 切换，带浮动切换按钮
- **开发工具**：通过 `window.__DEV_TOOLS__` 进行全局调试
- **类型安全**：完整的 TypeScript 集成与 OpenAPI 规范

## 组件库

⚠️ **关键提示**：使用 UI 组件、构建新功能或修改现有组件功能时，**务必先阅读 `COMPONENT_LIBRARY.md`** 获取完整文档。

### 自动导入系统

- **组件**：`src/components/` 中的所有组件自动导入
- **组合函数**：VueUse、Vue Router、Pinia 函数自动导入
- **Element Plus**：组件和图标自动导入
- **类型安全**：自动生成 TypeScript 定义

### 主要组件类别

**布局组件：**

- `ArtLayouts` - 主布局，支持响应式设计
- `ArtHeaderBar` - 顶部导航，包含全局搜索和通知
- `ArtWorkTab` - 多标签导航，支持状态持久化
- `ArtBreadcrumb` - 动态面包屑导航

**图表组件：**

- 全面的 ECharts 包装器（柱状图、折线图、饼图、雷达图、散点图、地图）
- 响应式设计，支持主题集成
- 性能优化，支持懒加载

**表单组件：**

- 增强的搜索栏，支持高级过滤
- Excel 导入/导出功能
- 富文本编辑器 (WangEditor) 集成
- 拖拽验证组件

## 项目架构

### 技术栈

- **Vue 3** - 使用 Composition API 和 `<script setup>` 语法
- **TypeScript** - 严格模式，确保完整类型安全
- **Vite** - 快速开发和优化构建
- **Element Plus** - 主要 UI 组件库
- **Pinia** - 状态管理，支持持久化
- **Vue Router 4** - 使用 hash 历史记录
- **SCSS** - 使用 CSS 自定义属性进行主题化

### 目录结构

这是一个基于 **Vue 3 + TypeScript + Vite** 的管理系统，目录结构如下：

```
src/
├── api/                  # 旧版 API 定义（已弃用，请使用 services/）
├── assets/               # 静态资源（样式、图片、字体、图标）
├── components/           # Vue 组件
│   ├── core/            # 核心可复用组件（图表、表单、表格等）
│   ├── custom/          # 业务特定组件
│   └── dev/             # 开发/调试组件
├── composables/         # Vue Composition API 组合式函数
├── config/              # 应用配置
├── directives/          # 自定义 Vue 指令
├── enums/               # TypeScript 枚举
├── locales/             # i18n 国际化语言文件
├── main.ts              # 应用入口文件
├── mock/                # 开发用模拟数据
├── router/              # Vue Router 路由配置
├── services/            # API 服务层
│   ├── ai/              # AI 服务模块（内容生成、大纲等）
│   ├── auth/            # 认证服务
│   ├── core/            # 核心业务服务（素材、项目等）
│   └── base/            # 基础 HTTP 客户端和工具
├── store/               # Pinia 状态管理
├── types/               # TypeScript 类型定义
│   ├── ai/              # AI 服务类型
│   ├── api/             # API 请求/响应类型
│   ├── core/            # 核心业务类型
│   └── ...              # 其他领域类型
├── utils/               # 工具函数
└── views/               # 页面组件
    ├── auth/            # 认证页面
    ├── document-generation/  # 文档生成工作流（v2/ 表示重构版本）
    ├── material/        # 素材管理
    └── ...
```

### API 集成架构

**基于 OpenAPI 的开发方式：**

- OpenAPI 规范存储在 `/ai_openapi/` 和 `/core_openapi/` 目录
- 运行 `pnpm generate:api:core` 从 OpenAPI 规范重新生成类型
- 类型定义自动生成并存储在 `/src/types/` 目录
- 每个服务模块在同域目录中有对应的类型定义

**服务层结构：**

- `services/` 包含所有 API 集成
- `services/ai/` 处理 AI 功能（内容生成、大纲创建等）
- `services/core/` 处理核心业务逻辑（素材、项目、大纲等）
- `services/base/apiService.ts` 提供带拦截器的基础 HTTP 客户端

### 状态管理

**Pinia 存储：**

- 全局状态通过 Pinia 管理，位置在 `/src/store/`
- 模块化存储位于 `/src/store/modules/`
- 关键存储：`user`、`material`、`project`、`outline`、`setting`、`menu`、`worktab`
- 轮询功能位于 `/src/store/polling.ts`，用于异步操作

### 路由架构

**Vue Router 配置：**

- 基于哈希的路由（`createWebHashHistory`）
- 静态路由位于 `/src/router/routes/staticRoutes.ts`
- 动态路由从菜单配置加载
- 路由守卫位于 `/src/router/guards/`
  - `beforeEach.ts` - 认证和权限检查
  - `afterEach.ts` - 分析和进度跟踪

### 文档生成工作流

**多步骤流程：**

1. **主题选择** (`/document-generation/topic-selection`) - 选择或输入主题
2. **大纲生成** (`/document-generation/outline`) - AI 生成大纲
3. **内容生成** (`/document-generation/content`) - 生成和编辑内容
4. **素材管理** (`/material/management`) - 将素材与文档关联

**工作流状态管理组合式函数：**

- `useTopicSelection.ts` - 主题选择状态
- `useOutlinePage.ts` - 大纲生成和编辑
- `useContent.ts` - 内容编辑和 AI 辅助
- `useMaterialSearch.ts` - 素材搜索和管理

### 组件架构

**三层组件系统：**

1. **核心组件** (`/components/core/`) - 底层 UI 基础组件（图表、表单、表格）
2. **自定义组件** (`/components/custom/`) - 业务组件（文档编辑器、素材卡片）
3. **页面组件** (`/views/`) - 完整页面视图

**关键自定义组件：**

- `document/` - 文档编辑器、大纲编辑器、统计面板
- `material-card/` - 素材展示和管理
- `material-search/` - 搜索和筛选素材

### 开发模式

**Vue 3 Composition API：**

- 所有组件使用 `<script setup>` 语法
- 逻辑提取到 `/src/composables/` 中的组合式函数
- 可复用工具位于 `/src/utils/`

**类型安全：**

- `tsconfig.json` 中的严格 TypeScript 配置
- `/src/types/` 中的全面类型定义
- 自动导入配置带类型声明

**样式架构：**

- SCSS 变量和混入
- 主题支持（亮色/暗色模式）
- 组件作用域样式与全局变量
- Element Plus UI 库与自定义主题覆盖

### 关键功能

**AI 驱动的文档生成：**

- AI 生成大纲
- 内容生成和编辑
- AI 辅助素材绑定
- 实时预览和统计

**素材管理：**

- 上传和组织素材
- AI 驱动的素材匹配
- 搜索和筛选素材
- 将素材关联到文档章节

**项目管理：**

- 创建和管理文档项目
- 版本跟踪
- 导出功能（PDF、Word 等）

### 开发工作流

**代码质量：**

- Husky 和 lint-staged 预提交钩子
- ESLint 代码质量检查
- Prettier 代码格式化
- Stylelint SCSS/CSS 质量检查
- Commitizen 标准化提交消息

**API 开发：**

1. 在 `/ai_openapi/` 或 `/core_openapi/` 中添加/编辑 OpenAPI 规范
2. 运行 `pnpm generate:api:core` 重新生成类型
3. 在适当的 `/services/` 目录实现服务
4. 创建组合式函数进行状态管理
5. 在适当目录构建 UI 组件

**测试：**

- `/src/mock/` 中提供模拟数据
- 可通过环境变量切换 API 模拟
- 使用组合式函数隔离测试组件

### 环境配置

**关键环境变量：**

- `VITE_API_URL` - 后端 API URL
- `VITE_API_PROXY_URL` - 开发代理目标
- `VITE_PORT` - 开发服务器端口
- `VITE_BASE_URL` - 生产环境基础 URL
- `VITE_VERSION` - 应用版本

**配置文件：**

- `vite.config.ts` - Vite 配置和插件
- `.env*` - 环境特定变量
- `eslint.config.mjs` - ESLint 规则
- `.stylelintrc.cjs` - Stylelint 配置
- `.prettierrc` - Prettier 格式化规则

### 构建配置

**Vite 优化：**

- Vue、Vue Router、Pinia、VueUse 自动导入
- Element Plus 组件自动导入
- 供应商库手动分块（Vue、Router、Pinia、Element Plus）
- 启用 Gzip 压缩
- 生产环境移除 console

**路径别名：**

- `@/` - src 目录
- `@views/` - views 目录
- `@imgs/` - assets/img 目录
- `@icons/` - assets/icons 目录
- `@utils/` - utils 目录
- `@stores/` - store 目录
- `@plugins/` - plugins 目录
- `@styles/` - assets/styles 目录

### 重要开发说明

1. **类型共位**：每个服务模块的类型位于 `/src/types/{domain}/`
2. **模拟集成**：使用 `/src/mock/` 在无后端情况下开发
3. **组件发现**：组件自动导入，无需手动导入
4. **路由配置**：路由从菜单配置动态加载
5. **AI 服务**：AI 功能需要后端 API 集成
6. **重构**：部分页面有 v2/ 版本，正在开发改进架构

### API 架构

- **基于服务的组织**：`src/services/` 中的模块化 API 服务
- **基础服务类**：`BaseApiService` 提供一致的模式
- **HTTP 客户端**：高级 Axios 包装器，支持重试、缓存和错误处理
- **类型安全**：完整的 TypeScript 集成，包含请求/响应类型

### 状态管理

- **模块化 Pinia 存储**：针对不同关注点的独立存储
- **持久化**：自动 localStorage 同步，支持版本控制
- **关键存储**：`user`、`setting`、`menu`、`worktab`、`table`

## 开发指南

### 页面开发

- 在 `src/views/` 中创建页面，使用适当的子目录
- 使用 `<script setup>` 语法进行 Vue 3 Composition API 开发
- 遵循 TypeScript 严格模式要求
- 采用移动优先方法确保响应性

### 代码质量

- **TypeScript 严格模式**：要求完整类型安全
- **ESLint + Prettier**：一致的代码格式化
- **Husky + lint-staged**：预提交质量检查
- **Commitizen**：标准化的提交消息格式

### 测试要求

- 测试亮色和暗色主题
- 确保移动设备响应性
- 验证用户面向文本的国际化
- 测试模拟和真实 API 端点之间的切换

### 关键指令

- `v-permission` - 基于角色的元素可见性
- `v-highlight` - 文本高亮效果
- `v-ripple` - Material Design 波纹效果

## 开发工具与调试

### 全局开发工具

通过 `window.__DEV_TOOLS__` 访问：

- API 配置检查
- 模拟/真实 API 切换
- 请求/响应监控
- 性能调试

### 键盘快捷键

- 开发模式常用操作快捷键
- 主题切换热键
- 组件检查工具

## 性能与优化

### 构建优化

- Vite 实现快速开发和优化生产构建
- 基于路由的代码分割，组件懒加载
- 消除死代码的 Tree shaking
- 资源 Gzip 压缩

### 运行时优化

- 大数据表格的虚拟滚动
- 搜索输入防抖
- 记忆化计算属性
- Vue 3 响应式系统的高效重渲染

## 重要约定

### 组件开发

- 遵循 `src/components/core/` 中的现有组件模式
- 使用 CSS 自定义属性进行主题化
- 实现适当的 TypeScript 接口
- 包含可访问性考虑

### API 开发

- 使用集中化的 API 配置系统
- 实现适当的错误处理，提供用户友好的消息
- 在有益时添加适当的请求缓存
- 遵循基于服务的架构模式

### 状态管理

- 使用 Pinia 存储共享状态
- 实现适当的存储持久化，支持版本控制
- 遵循 Vue 3 Composition API 的响应式模式
- 使用组合函数处理可重用逻辑

此架构代表了一个成熟的、企业级的 Vue 3 应用程序，具有全面的工具链、类型安全和开发者体验优化。模块化设计和广泛的组件库使其适合快速开发复杂的管理界面，同时保持代码质量和一致性。
