# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## File Synchronization Requirement

⚠️ **IMPORTANT**: Whenever updating this file, you **MUST** also update `CLAUDE_ZH.md` to ensure both files remain consistent and up-to-date.

## Development Commands

### Core Development

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production (includes TypeScript compilation)
- `pnpm serve` - Preview production build locally
- `pnpm lint` - Run ESLint for code quality checks
- `pnpm fix` - Run ESLint with auto-fix
- `pnpm lint:prettier` - Format code with Prettier
- `pnpm lint:stylelint` - Lint and fix CSS/SCSS styles
- `pnpm clean:dev` - Clean development environment

### Code Quality Tools

The project uses:

- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting
- Stylelint for CSS/SCSS linting
- Husky for git hooks
- lint-staged for pre-commit checks
- Commitizen for standardized commit messages

## Project Directory Structure

```
src/
├── api/                     # API 接口相关代码
│   ├── articleApi.ts       # 文章相关的 API 接口定义
│   ├── menuApi.ts          # 菜单相关的 API 接口定义
│   ├── modules/            # API 模块化目录
│   └── usersApi.ts         # 用户相关的 API 接口定义
├── App.vue                 # Vue 根组件
├── assets/                 # 静态资源目录
│   ├── fonts/              # 字体文件
│   ├── icons/              # 图标文件
│   ├── img/                # 图片资源
│   ├── styles/             # 全局 CSS/SCSS 样式文件
│   └── svg/                # SVG 图标资源
├── components/             # 组件目录
│   ├── core/               # 系统组件库
│   └── custom/             # 自定义组件库
├── composables/            # Vue 3 Composable 函数
│   ├── useAuth.ts          # 认证相关逻辑
│   ├── useCeremony.ts      # 节日活动相关逻辑
│   ├── useChart.ts         # 图表相关逻辑
│   ├── useCheckedColumns.ts # 表格列选择逻辑
│   ├── useCommon.ts        # 通用 Composable 函数
│   ├── useSystemInfo.ts    # 系统信息相关逻辑
│   └── useTheme.ts         # 主题切换逻辑
├── config/                 # 项目配置目录
│   ├── assets/             # 静态资源配置
│   ├── festival.ts         # 节日/活动相关配置
│   └── index.ts            # 全局配置文件
├── directives/             # Vue 自定义指令
│   ├── highlight.ts        # 高亮指令
│   ├── index.ts            # 指令入口文件
│   ├── permission.ts       # 权限指令
│   └── ripple.ts           # 波纹效果指令
├── enums/                  # 枚举定义
│   ├── appEnum.ts          # 应用级枚举
│   └── formEnum.ts         # 表单相关枚举
├── env.d.ts                # TypeScript 环境声明
├── locales/                # 国际化资源
│   ├── index.ts            # 国际化入口文件
│   └── langs/              # 多语言文件
├── main.ts                 # 项目主入口文件
├── mock/                   # Mock 数据目录
│   ├── json/               # JSON 格式 Mock 数据
│   ├── temp/               # 临时 Mock 数据
│   └── upgrade/            # 更新日志相关 Mock 数据
├── router/                 # Vue Router 路由相关代码
│   ├── guards/             # 路由守卫
│   ├── index.ts            # 路由主入口
│   ├── routes/             # 路由定义
│   ├── routesAlias.ts      # 路由别名定义
│   └── utils/              # 路由工具函数
├── store/                  # Pinia 状态管理
│   ├── index.ts            # Pinia 存储入口
│   └── modules/            # 分模块的状态管理
├── types/                  # TypeScript 类型定义
│   ├── api/                # API 相关类型
│   ├── auto-imports.d.ts   # 自动导入的类型声明
│   ├── common/             # 通用类型定义
│   ├── component/          # 组件相关类型
│   ├── components.d.ts     # 全局组件类型声明
│   ├── config/             # 配置相关类型
│   ├── index.ts            # 类型定义入口
│   ├── router/             # 路由相关类型
│   └── store/              # 状态管理相关类型
├── utils/                  # 工具函数目录
│   ├── browser/            # 浏览器相关工具
│   ├── constants/          # 常量定义
│   ├── dataprocess/        # 数据处理工具
│   ├── http/               # HTTP 请求工具
│   ├── index.ts            # 工具函数入口
│   ├── navigation/         # 导航相关工具
│   ├── storage/            # 存储相关工具
│   ├── sys/                # 系统相关工具
│   ├── theme/              # 主题相关工具
│   ├── ui/                 # UI 相关工具
│   └── validation/         # 表单验证工具
└── views/                  # 页面组件目录
    ├── article/            # 文章相关页面
    ├── auth/               # 认证相关页面
    ├── change/             # 更新日志页面
    ├── dashboard/          # 仪表盘页面
    ├── exception/          # 异常页面
    ├── index/              # 布局页面
    ├── outside/            # 外部页面
    ├── result/             # 结果页面
    ├── safeguard/          # 安全相关页面
    ├── system/             # 系统管理页面
    ├── template/           # 模板页面
    └── widgets/            # 小组件页面
```

## Project Architecture

### Technology Stack

- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety
- **Vite** for build tooling and development server
- **Vue Router 4** for routing with hash history
- **Pinia** for state management with persistence
- **Element Plus** for UI components
- **Axios** for HTTP requests with retry logic
- **Vue I18n** for internationalization
- **SCSS** for styling with modern compiler

### Key Architectural Patterns

#### State Management (Pinia)

- Modular stores in `src/store/modules/`
- Automatic persistence with versioned storage keys
- Storage migration handling via `StorageKeyManager`
- Key stores: `user`, `setting`, `menu`, `worktab`, `table`

#### Routing System

- **Hybrid routing**: static routes + dynamic permission-based routes
- **Route guards**: authentication and authorization with loading states
- **Two permission modes**: Frontend (static config) vs Backend (dynamic API)
- **Progressive route registration**: dynamic routes added on-demand
- **Menu-driven navigation**: routes generated from menu structure

**Core Router Architecture:**

```
src/router/
├── index.ts                    # Router instance and initialization
├── routes/
│   ├── staticRoutes.ts         # Public routes (login, register, 404, etc.)
│   └── asyncRoutes.ts          # Permission-based routes with role filtering
├── guards/
│   ├── beforeEach.ts           # Authentication and route registration logic
│   └── afterEach.ts           # Loading state and progress management
├── utils/
│   ├── registerRoutes.ts       # Dynamic route registration with component loading
│   ├── menuToRouter.ts         # Menu-to-route conversion utilities
│   └── utils.ts                # Router helper functions
└── routesAlias.ts              # Route path aliases for easy navigation
```

**Route Registration Process:**

1. **Static Routes**: Always available (login, register, error pages)
2. **Dynamic Routes**: Registered after user authentication based on permissions
3. **Role Filtering**: Routes filtered by user roles in frontend mode
4. **Component Loading**: Dynamic imports with automatic path resolution
5. **Iframe Support**: External links rendered in iframe containers

**Route Features:**

- **Meta Information**: `title`, `icon`, `roles`, `keepAlive`, `isHide`, `authList`
- **Tab Management**: Route-based tab creation with persistence
- **Navigation Guards**: Login checks, permission validation, theme application
- **Error Handling**: 404/500 handling with graceful fallbacks
- **Progress Indicators**: NProgress integration for route transitions

#### HTTP Layer

- Centralized Axios instance in `src/utils/http/index.ts`
- Automatic token injection and error handling
- Request retry mechanism with configurable attempts
- 401 error debouncing to prevent multiple logout calls
- FormData and JSON content-type handling

#### Component Architecture

- Auto-import components from `src/components/`
- Element Plus components auto-resolved
- Type definitions auto-generated in `src/types/components.d.ts`
- Global directives for permissions and UI effects

## Component Library

⚠️ **IMPORTANT**: When working with UI components, building new features, or modifying existing component functionality, **ALWAYS read `COMPONENT_LIBRARY.md` first** for comprehensive documentation.

### Quick Overview

The project features a comprehensive component library with 50+ components divided into:

- **Core Components** (`src/components/core/`) - System components across 12 categories
- **Custom Components** (`src/components/custom/`) - Developer-specific components

### Key Component Categories

1. **Layout Components** - Application structure and navigation
2. **Chart Components** - Advanced ECharts data visualizations
3. **Form Components** - Enhanced form controls and validation
4. **Table Components** - Data tables with advanced features
5. **Card Components** - Data display and statistics
6. **Media Components** - Video, image, and media handling
7. **Text Effect Components** - Animated text displays
8. **Menu Components** - Navigation systems

### When to Read Component Library Documentation

**Read `COMPONENT_LIBRARY.md` when:**

- Building new UI features or pages
- Modifying existing component behavior
- Creating new components
- Debugging component-related issues
- Needing detailed prop information
- Working with charts or advanced components
- Implementing responsive design
- Adding accessibility features
- Optimizing component performance

**Component library documentation includes:**

- Complete prop interfaces and default values
- Advanced functionality and integration details
- Performance considerations and best practices
- TypeScript usage patterns
- Theme integration guidelines
- Responsive design implementation
- Accessibility requirements
- Troubleshooting common issues

### Component Features

#### Auto-Import System

- All components are automatically imported and available globally
- TypeScript definitions auto-generated
- No manual import statements required
- Tree-shaking optimized

#### Theme Integration

- All components support light/dark themes
- CSS custom properties for dynamic theming
- Consistent design system
- Responsive breakpoints

#### TypeScript Support

- Full type definitions for all props
- Generic type support where applicable
- Auto-completion in IDEs
- Runtime type checking

#### Accessibility

- ARIA labels and attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management

#### Performance Optimizations

- Lazy loading for heavy components
- Virtual scrolling for large lists
- Debounced event handlers
- Efficient re-rendering

#### Responsive Design

- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interactions
- Adaptive component sizing
- Language files in `src/locales/langs/`
- Dynamic locale switching with persisted preferences

### Directory Structure Insights

#### `src/composables/`

Reusable composition functions:

- `useAuth.ts` - Authentication logic
- `useTheme.ts` - Theme switching and management
- `useChart.ts` - ECharts configuration
- `useCheckedColumns.ts` - Table column visibility
- `useSystemInfo.ts` - System information handling

#### `src/utils/`

Utility modules with specific responsibilities:

- `http/` - HTTP client and error handling
- `storage/` - Local storage with versioning and migration
- `theme/` - Theme switching and CSS variable management
- `navigation/` - Routing and tab management utilities
- `dataprocess/` - Data transformation and formatting

#### `src/types/`

Comprehensive TypeScript definitions:

- Auto-generated types from unplugin imports
- API response types in `api/`
- Router type extensions
- Store state types

#### `src/directives/`

Custom Vue directives:

- `permission.ts` - Role-based element visibility
- `highlight.ts` - Text highlighting effects
- `ripple.ts` - Material Design ripple effects

### Build Configuration

#### Vite Configuration

- Path aliases for clean imports (`@`, `@views`, `@utils`, etc.)
- Auto-imports for Vue, Vue Router, Pinia, and VueUse
- Component auto-resolution with Element Plus
- Production optimizations:
  - Terser minification with console removal
  - Manual chunk splitting for vendor code
  - Gzip compression
  - CSS optimization

#### Development Features

- Hot Module Replacement (HMR)
- Vue DevTools integration
- Progress indicators for route changes
- Loading states for async operations

### Permission System

#### Two Permission Modes

1. **Frontend Mode**: Routes defined locally, filtered by user roles
2. **Backend Mode**: Dynamic routes fetched from API

#### Permission Controls

- Route-level guards in `src/router/guards/`
- Component-level `v-permission` directive
- Menu visibility based on user roles
- API request authentication via JWT tokens

### Storage Strategy

#### Versioned Storage

- Automatic versioning via `StorageKeyManager`
- Data migration between versions
- Cleanup of old storage keys
- Compatibility checks for storage availability

#### Persistent Data

- User preferences and settings
- Authentication tokens
- UI state (theme, language, layout)
- Worktab state and navigation history

### Error Handling

#### HTTP Errors

- Centralized error handling in HTTP interceptors
- Automatic retry for transient failures
- User-friendly error messages via i18n
- Graceful handling of authentication failures

#### Route Errors

- 404 handling for unknown routes
- 500 error page for server errors
- Route guards with error boundaries
- Loading states for async route resolution

### Theme System

#### Theme Switching

- Light/dark theme support
- CSS custom properties for dynamic theming
- Smooth transitions between themes
- Element Plus theme customization
- Persistent theme preferences

#### CSS Architecture

- SCSS with modern compiler
- Global variables and mixins
- Component-scoped styles
- Responsive design utilities

### Code Standards

#### TypeScript

- Strict type checking
- Comprehensive type definitions
- Auto-import type generation
- API response type safety

#### Vue Patterns

- Composition API with `<script setup>`
- Proper reactive state management
- Composable functions for reusable logic
- Type-safe component props and emits

#### API Design

- RESTful API conventions
- Class-based API services
- TypeScript interfaces for requests/responses
- Centralized error handling

### Mobile Optimization

#### Responsive Design

- Mobile-first CSS approach
- Touch event handling
- Adaptive layouts and components
- Performance optimizations for mobile devices

#### Mobile Features

- Touch-friendly UI components
- Swipe gestures support
- Mobile-specific styling in `mobile.scss`
- Viewport meta tag management

### Development Workflow

#### Git Workflow

- Feature branch development
- Conventional commit messages
- Pre-commit hooks for code quality
- Automated linting and formatting

#### Testing Strategy

- Component testing ready (framework in place)
- API mocking capabilities in `src/mock/`
- Development-time data simulation
- Error boundary testing
