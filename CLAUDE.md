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

### 技术栈

#### 前端框架

- **Vue 3.5.12**：采用 Composition API 和 `<script setup>` 语法
- **TypeScript 5.6.3**：提供类型安全和更好的开发体验
- **Vite 6.1.0**：现代化的构建工具，提供快速的开发体验

#### 状态管理

- **Pinia 3.0.2**：Vue 3 官方推荐的状态管理库
- **pinia-plugin-persistedstate 4.3.0**：状态持久化插件

#### UI组件库

- **Element Plus 2.10.2**：基于 Vue 3 的企业级UI组件库
- **@element-plus/icons-vue 2.3.1**：Element Plus 图标库

#### 路由和导航

- **Vue Router 4.4.2**：Vue 3 官方路由管理器

#### HTTP客户端

- **Axios 1.7.5**：基于 Promise 的 HTTP 客户端

#### 工具库

- **@vueuse/core 11.0.0**：Vue 组合式函数工具集
- **lodash-es 4.17.21**：实用的 JavaScript 工具库
- **crypto-js 4.2.0**：加密算法库
- **mitt 3.0.1**：小型事件发射器

#### 图表和可视化

- **ECharts 5.6.0**：强大的数据可视化库

#### 编辑器和富文本

- **@wangeditor/editor 5.1.23**：富文本编辑器
- **@wangeditor/editor-for-vue**：WangEditor 的 Vue 3 组件

#### 其他功能

- **vue-i18n 9.14.0**：国际化支持
- **nprogress 0.2.0**：页面加载进度条
- **xlsx 0.18.5**：Excel 文件处理
- **file-saver 2.0.5**：文件保存工具
- **qrcode.vue 3.6.0**：二维码生成
- **vue-draggable-plus 0.6.0**：拖拽功能

#### 开发工具

- **ESLint 9.9.1**：代码质量检查
- **Prettier 3.5.3**：代码格式化
- **Stylelint 16.20.0**：样式代码检查
- **Husky 9.1.5**：Git 钩子管理
- **lint-staged 15.5.2**：暂存文件检查
- **commitizen 4.3.0**：规范化提交信息

**重要**：注意如果缺乏相关的类型定义与api信息，则参考@ai_openapi/ @core_openapi/ 在合适的文件中实现对应的代码

**重要**：注意，任意服务的类型将会定义在对应的types文件中，比如@src/types/core/auth.ts 对应@src/services/core/authService.ts，不要在其他地方找类型，也不要将对应类型定义到其他地方。

## Project Architecture

### Directory Structure

This is a **Vue 3 + TypeScript + Vite** admin management system with the following structure:

```
src/
├── assets/               # Static assets (styles, images, fonts, icons)
├── components/           # Vue components
│   ├── core/            # Core reusable components (charts, forms, tables, etc.)
│   ├── custom/          # Business-specific components
│   └── dev/             # Development/debug components
├── composables/         # Vue Composition API utilities
├── config/              # Application configuration
├── directives/          # Custom Vue directives
├── enums/               # TypeScript enums
├── locales/             # i18n language files
├── main.ts              # Application entry point
├── mock/                # Mock data for development
├── router/              # Vue Router configuration
├── services/            # API service layer
│   ├── ai/              # AI service modules (content, outline generation, etc.)
│   ├── auth/            # Authentication services
│   ├── core/            # Core business services (materials, projects, etc.)
│   └── base/            # Base HTTP client and utilities
├── store/               # Pinia state management
│   ├── material.ts      # Main material store (legacy, ~1200 lines)
│   ├── polling.ts       # Async task polling management
│   └── modules/         # Modular stores
├── types/               # TypeScript type definitions
│   ├── ai/              # AI service types
│   ├── api/             # API request/response types
│   ├── core/            # Core business types
│   └── ...              # Other domain types
├── utils/               # Utility functions
└── views/               # Page components
    ├── auth/            # Authentication pages
    ├── document-generation/  # Document generation workflow (v2/ variants for refactoring)
    ├── material/        # Material management
    └── ...
```

### API Integration Architecture

**OpenAPI-Driven Development:**

- OpenAPI specifications are stored in `/ai_openapi/` and `/core_openapi/`
- Run `pnpm generate:api:core` to regenerate types from OpenAPI specs
- Type definitions are automatically generated and stored in `/src/types/`
- Each service module has corresponding types in the same domain

**Service Layer Structure:**

- `services/` contains all API integrations
- `services/ai/` handles AI-powered features (content generation, outline creation, etc.)
- `services/core/` handles core business logic (materials, projects, outlines, etc.)
- `services/base/apiService.ts` provides the base HTTP client with interceptors

### State Management

**Pinia Stores:**

- Global state managed via Pinia in `/src/store/`
- Module-based stores in `/src/store/modules/`
- Key stores: `user`, `material`, `project`, `outline`, `setting`, `menu`, `worktab`
- Polling functionality in `/src/store/polling.ts` for async operations

### Routing Architecture

**Vue Router Configuration:**

- Hash-based routing (`createWebHashHistory`)
- Static routes in `/src/router/routes/staticRoutes.ts`
- Dynamic routes loaded from menu configuration
- Route guards in `/src/router/guards/`
  - `beforeEach.ts` - Authentication and permission checks
  - `afterEach.ts` - Analytics and progress tracking

### Document Generation Workflow

**Multi-Step Process:**

1. **Topic Selection** (`/document-generation/topic-selection`) - Select or enter topic
2. **Outline Generation** (`/document-generation/outline`) - AI-powered outline creation
3. **Content Generation** (`/document-generation/content`) - Generate and edit content
4. **Materials Management** (`/material/management`) - Associate materials with documents

**Composables for Workflow State:**

- `useTopicSelection.ts` - Topic selection state
- `useOutlinePage.ts` - Outline generation and editing
- `useContent.ts` - Content editing and AI assistance
- `useMaterialSearch.ts` - Material search and management

### Component Architecture

**Three-Tier Component System:**

1. **Core Components** (`/components/core/`) - Low-level UI primitives (charts, forms, tables)
2. **Custom Components** (`/components/custom/`) - Business components (document editor, material cards)
3. **Page Components** (`/views/`) - Full page views

**Key Custom Components:**

- `document/` - Document editor, outline editor, stats panel
- `material-card/` - Material display and management
- `material-search/` - Search and filter materials

### Development Patterns

**Vue 3 Composition API:**

- All components use `<script setup>` syntax
- Logic extracted to composables in `/src/composables/`
- Reusable utilities in `/src/utils/`

**Type Safety:**

- Strict TypeScript configuration in `tsconfig.json`
- Comprehensive type definitions in `/src/types/`
- Auto-imports configured with type declarations

**Style Architecture:**

- SCSS with variables and mixins
- Theme support (light/dark modes)
- Component-scoped styles with global variables
- Element Plus UI library with custom theme overrides

### Key Features

**AI-Powered Document Generation:**

- Outline generation with AI
- Content generation and editing
- Material binding with AI assistance
- Real-time preview and statistics

**Material Management:**

- Upload and organize materials
- AI-powered material matching
- Search and filter materials
- Associate materials with document sections

**Project Management:**

- Create and manage document projects
- Version tracking
- Export capabilities (PDF, Word, etc.)

### Development Workflow

**Code Quality:**

- Pre-commit hooks via Husky and lint-staged
- ESLint for code quality
- Prettier for code formatting
- Stylelint for SCSS/CSS quality
- Commitizen for standardized commit messages

**API Development:**

1. Add/edit OpenAPI spec in `/ai_openapi/` or `/core_openapi/`
2. Run `pnpm generate:api:core` to regenerate types
3. Implement service in appropriate `/services/` directory
4. Create composables for state management
5. Build UI components in appropriate directories

**Testing:**

- Mock data available in `/src/mock/`
- API mocking can be toggled via environment variables
- Test components in isolation using composables

### Environment Configuration

**Key Environment Variables:**

- `VITE_API_URL` - Backend API URL
- `VITE_API_PROXY_URL` - Proxy target for development
- `VITE_PORT` - Development server port
- `VITE_BASE_URL` - Base URL for production
- `VITE_VERSION` - Application version

**Configuration Files:**

- `vite.config.ts` - Vite configuration with plugins
- `.env*` - Environment-specific variables
- `eslint.config.mjs` - ESLint rules
- `.stylelintrc.cjs` - Stylelint configuration
- `.prettierrc` - Prettier formatting rules

### Build Configuration

**Vite Optimization:**

- Auto-import for Vue, Vue Router, Pinia, VueUse
- Component auto-import from Element Plus
- Manual chunks for vendor libraries (Vue, Router, Pinia, Element Plus)
- Gzip compression enabled
- Console removal in production

**Path Aliases:**

- `@/` - src directory
- `@views/` - views directory
- `@imgs/` - assets/img directory
- `@icons/` - assets/icons directory
- `@utils/` - utils directory
- `@stores/` - store directory
- `@plugins/` - plugins directory
- `@styles/` - assets/styles directory

### Important Development Notes

1. **Type Co-location:** Types for each service module are co-located in `/src/types/{domain}/`
2. **Mock Integration:** Use `/src/mock/` for development without backend
3. **Component Discovery:** Components are auto-imported, no manual imports needed
4. **Router Configuration:** Routes are dynamically loaded from menu configuration
5. **AI Services:** AI features require backend API integration
6. **Technical Debt:** Large files needing refactoring:
   - `store/material.ts` (~1200 lines)
   - `store/modules/documentGenerate.ts` (~1400 lines)
   - `composables/document/useOutlinePage.ts` (~1200 lines)
