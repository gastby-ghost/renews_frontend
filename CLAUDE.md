# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## File Synchronization Requirement

⚠️ **IMPORTANT**: Whenever updating this file, you **MUST** also update `CLAUDE_ZH.md` to ensure both files remain consistent and up-to-date.

## Design-First Development Philosophy

⚠️ **CRITICAL**: When building new pages or features, **always start with design** and **always consider existing components first**. This project emphasizes a component-first approach to ensure consistency, maintainability, and efficiency.

### Design-First Workflow

1. **Analyze Requirements** - Understand what needs to be built
2. **Component Research** - Study existing components in `COMPONENT_LIBRARY.md` first
3. **Design with Components** - Design the page using available components before creating new ones
4. **Layout Planning** - Structure the page using existing layout components
5. **Component Composition** - Combine existing components to create new functionality
6. **Create New Components Only When Necessary** - Only build new components when existing ones cannot meet requirements

### Component-First Principles

- **Reuse Over Create**: Always prefer using existing components over creating new ones
- **Composition Over Customization**: Combine existing components rather than heavily customizing
- **Consistency Over Uniqueness**: Maintain design consistency across the application
- **Efficiency Over Novelty**: Build efficiently using proven components

## Essential Development Commands

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint for code quality checks
- `pnpm fix` - Run ESLint with auto-fix
- `pnpm lint:prettier` - Format code with Prettier

## Project Directory Structure

```
├── src
│   ├── api                     # API 接口相关代码
│   │   ├── articleApi.ts       # 文章相关的 API 接口定义（如获取文章列表、发布文章等）
│   │   ├── menuApi.ts          # 菜单相关的 API 接口定义（如获取动态菜单数据）
│   │   ├── modules             # API 模块化目录，存放细分领域的 API 定义（如用户、订单等）
│   │   └── usersApi.ts         # 用户相关的 API 接口定义（如登录、注册、用户信息）
│   ├── App.vue                 # Vue 根组件，定义应用的全局结构和入口
│   ├── assets                  # 静态资源目录
│   │   ├── fonts               # 字体文件（如自定义字体或图标字体）
│   │   ├── icons               # 图标文件（可能包含 PNG、SVG 等格式的图标）
│   │   ├── img                 # 图片资源（如背景图、Logo 等）
│   │   ├── styles              # 全局 CSS/SCSS 样式文件（如变量、主题、公共样式）
│   │   └── svg                 # SVG 图标资源（通常用于矢量图标）
│   ├── components              # 组件目录
│   │   ├── core                # 系统组件（系统组件库）
│   │   └── custom              # 自定义组件（开发者组件库）
│   ├── composables             # Vue 3 Composable 函数，封装可复用的逻辑
│   │   ├── useAuth.ts          # 认证相关逻辑（如登录状态、权限检查）
│   │   ├── useCeremony.ts      # 可能与特定仪式/活动相关的逻辑（如节日活动）
│   │   ├── useChart.ts         # 图表相关逻辑（如 ECharts 或 Chart.js 配置）
│   │   ├── useCheckedColumns.ts # 表格列选择逻辑（如动态显示/隐藏列）
│   │   ├── useCommon.ts        # 通用的 Composable 函数（如工具方法集合）
│   │   ├── useSystemInfo.ts    # 系统信息相关逻辑（如版本号、环境配置）
│   │   └── useTheme.ts         # 主题切换逻辑（如暗黑模式、主题色切换）
│   ├── config                  # 项目配置目录
│   │   ├── assets              # 静态资源配置（如图片路径、CDN 地址）
│   │   ├── festival.ts         # 节日/活动相关配置（如节日主题、时间表）
│   │   └── index.ts            # 全局配置文件（如系统名称、API 基础 URL）
│   ├── directives              # Vue 自定义指令
│   │   ├── highlight.ts        # 高亮指令（如文本或元素高亮效果）
│   │   ├── index.ts            # 指令入口文件，导出所有指令
│   │   ├── permission.ts       # 权限指令（如控制元素显示基于用户权限）
│   │   └── ripple.ts           # 波纹效果指令（通常用于按钮点击效果）
│   ├── enums                   # 枚举定义
│   │   ├── appEnum.ts          # 应用级枚举（如主题类型、语言类型）
│   │   └── formEnum.ts         # 表单相关枚举（如表单状态、验证规则）
│   ├── env.d.ts                # TypeScript 环境声明文件（如 Vite 环境变量类型）
│   ├── locales                 # 国际化（i18n）资源
│   │   ├── index.ts            # 国际化入口文件，配置 i18n 插件
│   │   └── langs               # 多语言文件（如 en.json、zh.json）
│   ├── main.ts                 # 项目主入口文件，初始化 Vue 应用、路由、状态管理等
│   ├── mock                    # Mock 数据目录，用于开发或测试环境
│   │   ├── json                # JSON 格式的 Mock 数据（如模拟 API 响应）
│   │   ├── temp                # 临时 Mock 数据或测试用例
│   │   └── upgrade             # 更新日志相关的 Mock 数据
│   ├── router                  # Vue Router 路由相关代码
│   │   ├── guards              # 路由守卫（如认证、权限控制）
│   │   ├── index.ts            # 路由主入口，初始化路由器
│   │   ├── routes              # 路由定义（如静态路由、动态路由）
│   │   ├── routesAlias.ts      # 路由别名定义（如路径常量或重定向映射）
│   │   └── utils               # 路由工具函数（如动态路由注册、菜单转换）
│   ├── store                   # Pinia 状态管理
│   │   ├── index.ts            # Pinia 存储入口，初始化 store
│   │   └── modules             # 分模块的状态管理（如 user、settings）
│   ├── types                   # TypeScript 类型定义
│   │   ├── api                 # API 相关类型（如请求/响应接口）
│   │   ├── auto-imports.d.ts   # 自动导入的类型声明（如 Vite 插件生成）
│   │   ├── common              # 通用的类型定义（如工具类型、接口）
│   │   ├── component           # 组件相关类型（如 Props、Emits）
│   │   ├── components.d.ts     # 全局组件类型声明（Vite 自动生成）
│   │   ├── config              # 配置相关类型（如系统配置、环境变量）
│   │   ├── index.ts            # 类型定义入口，导出所有类型
│   │   ├── router              # 路由相关类型（如 RouteRecordRaw 扩展）
│   │   └── store               # 状态管理相关类型（如 Pinia store 定义）
│   ├── utils                   # 工具函数目录
│   │   ├── browser             # 浏览器相关工具（如检测浏览器类型、操作 DOM）
│   │   ├── constants           # 常量定义（如 API 状态码、配置值）
│   │   ├── dataprocess         # 数据处理工具（如格式化、过滤、转换）
│   │   ├── http                # HTTP 请求工具（如 Axios 封装）
│   │   ├── index.ts            # 工具函数入口，导出所有工具
│   │   ├── navigation          # 导航相关工具（如路由跳转、页面切换）
│   │   ├── storage             # 存储相关工具（如 localStorage、sessionStorage）
│   │   ├── sys                 # 系统相关工具（如获取设备信息、系统配置）
│   │   ├── theme               # 主题相关工具（如动态切换 CSS 变量）
│   │   ├── ui                  # UI 相关工具（如弹窗、通知封装）
│   │   └── validation          # 表单验证工具（如正则表达式、验证规则）
│   └── views                   # 页面组件目录
│       ├── article             # 文章相关页面（如文章列表、详情）
│       ├── auth                # 认证相关页面（如登录、注册、忘记密码）
│       ├── change              # 更新日志页面（如版本记录、变更说明）
│       ├── dashboard           # 仪表盘页面（如数据概览、统计图表）
│       ├── exception           # 异常页面（如 404、500 错误页面）
│       ├── index               # 布局页面（如 Layout 组件，包含头部、侧边栏）
│       ├── outside             # 外部页面（如 iframe 嵌入的外部内容）
│       ├── result              # 结果页面（如操作成功、失败提示）
│       ├── safeguard           # 安全相关页面（如权限管理、安全设置）
│       ├── system              # 系统管理页面（如用户管理、角色管理）
│       ├── template            # 模板页面（可复用的页面模板）
│       └── widgets             # 小组件页面（如独立功能模块、微页面）
├── tsconfig.json               # TypeScript 配置文件，定义编译选项
└── vite.config.ts              # Vite 配置文件，定义构建、开发服务器、插件等
```

## Technology Stack

- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety
- **Vue Router 4** for routing
- **Pinia** for state management
- **Element Plus** for UI components
- **SCSS** for styling

## Component Library

⚠️ **CRITICAL**: When working with UI components, building new features, or modifying existing component functionality, **ALWAYS read `COMPONENT_LIBRARY.md` first** for comprehensive documentation.

### Component-First Design Approach

**Before starting any page development, follow this process:**

1. **Review Available Components** - Study all existing components in `COMPONENT_LIBRARY.md`
2. **Design with Existing Components** - Plan your page layout using available components
3. **Check Component Capabilities** - Understand props, slots, and customization options
4. **Compose Rather Than Create** - Combine existing components to achieve desired functionality
5. **Only Create New Components When Absolutely Necessary**

**When to Create New Components:**

- No existing component provides the required functionality
- The component will be reused in multiple places
- The component represents a distinct UI pattern not covered by existing components

**When NOT to Create New Components:**

- Minor styling differences can be achieved with props or CSS overrides
- Functionality can be achieved by composing existing components
- The component would be used only once

### Key Component Categories

1. **Layout Components** - Application structure and navigation
2. **Chart Components** - Advanced ECharts data visualizations
3. **Form Components** - Enhanced form controls and validation
4. **Table Components** - Data tables with advanced features
5. **Card Components** - Data display and statistics
6. **Media Components** - Video, image, and media handling

### Available Composables

- `useAuth.ts` - Authentication logic
- `useTheme.ts` - Theme switching and management
- `useChart.ts` - ECharts configuration
- `useCheckedColumns.ts` - Table column visibility
- `useSystemInfo.ts` - System information handling

## Page Development Guidelines

### Page Structure

- Create pages in `src/views/` with appropriate subdirectories
- Use `<script setup>` syntax for Vue 3 Composition API
- Import components from the component library (auto-imported)
- Follow TypeScript best practices with proper typing

### State Management

- Use Pinia stores for state that needs to persist or be shared
- Key stores: `user`, `setting`, `menu`, `worktab`, `table`
- Use composables for reusable logic

### Routing

- Pages are automatically routed based on file structure
- Use route guards for authentication and permissions
- Implement proper error handling for unknown routes

### Styling

- Use SCSS for component styles
- Follow the established theme system
- Ensure responsive design with mobile-first approach
- Use CSS custom properties for theming

### Key Directives

- `v-permission` - Role-based element visibility
- `v-highlight` - Text highlighting effects
- `v-ripple` - Material Design ripple effects

## Essential Utilities

### HTTP Requests

- Centralized Axios instance in `src/utils/http/index.ts`
- Automatic token injection and error handling
- Request retry mechanism

### Storage

- Versioned local storage with migration support
- Persistent user preferences and settings

### Navigation

- Tab management utilities
- Route helpers and navigation functions

## Important Development Notes

- All components are auto-imported - no manual imports needed
- TypeScript definitions are auto-generated
- Follow the established code patterns and conventions
- Always test with both light and dark themes
- Ensure mobile responsiveness for all pages
- Use internationalization for user-facing text
