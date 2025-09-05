# CLAUDE_ZH.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供中文指导。

## 开发命令

### 核心开发

- `pnpm dev` - 启动开发服务器，支持热重载
- `pnpm build` - 构建生产版本（包含 TypeScript 编译）
- `pnpm serve` - 本地预览生产构建
- `pnpm lint` - 运行 ESLint 进行代码质量检查
- `pnpm fix` - 运行 ESLint 自动修复
- `pnpm lint:prettier` - 使用 Prettier 格式化代码
- `pnpm lint:stylelint` - 检查和修复 CSS/SCSS 样式
- `pnpm clean:dev` - 清理开发环境

### 代码质量工具

项目使用：

- ESLint - JavaScript/TypeScript 代码检查
- Prettier - 代码格式化
- Stylelint - CSS/SCSS 样式检查
- Husky - Git 钩子
- lint-staged - 提交前检查
- Commitizen - 标准化提交消息

## 项目目录结构

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

## 项目架构

### 技术栈

- **Vue 3** - 使用 Composition API 和 `<script setup>` 语法
- **TypeScript** - 类型安全
- **Vite** - 构建工具和开发服务器
- **Vue Router 4** - 路由管理，使用 hash 模式
- **Pinia** - 状态管理，支持持久化
- **Element Plus** - UI 组件库
- **Axios** - HTTP 请求，支持重试逻辑
- **Vue I18n** - 国际化
- **SCSS** - 样式预处理，使用现代编译器

### 核心架构模式

#### 状态管理 (Pinia)

- 模块化存储在 `src/store/modules/`
- 自动持久化，支持版本化存储键
- 通过 `StorageKeyManager` 处理存储迁移
- 核心存储：`user`、`setting`、`menu`、`worktab`、`table`

#### 路由系统

- **混合路由**：静态路由 + 动态权限路由
- **路由守卫**：认证和授权，带加载状态
- **双权限模式**：前端（静态配置）vs 后端（动态 API）
- **渐进式路由注册**：按需添加动态路由
- **菜单驱动导航**：基于菜单结构生成路由

**核心路由架构：**

```
src/router/
├── index.ts                    # 路由实例创建和初始化
├── routes/
│   ├── staticRoutes.ts         # 公开路由（登录、注册、404等）
│   └── asyncRoutes.ts          # 基于权限的路由配置，支持角色过滤
├── guards/
│   ├── beforeEach.ts           # 认证和路由注册逻辑
│   └── afterEach.ts           # 加载状态和进度管理
├── utils/
│   ├── registerRoutes.ts       # 动态路由注册和组件加载
│   ├── menuToRouter.ts         # 菜单到路由转换工具
│   └── utils.ts                # 路由辅助函数
└── routesAlias.ts              # 路由路径别名，便于导航
```

**路由注册流程：**

1. **静态路由**：始终可用（登录、注册、错误页面）
2. **动态路由**：用户认证后根据权限注册
3. **角色过滤**：前端模式下根据用户角色过滤路由
4. **组件加载**：动态导入，自动路径解析
5. **iframe 支持**：外部链接在 iframe 容器中渲染

**路由特性：**

- **元信息**：`title`、`icon`、`roles`、`keepAlive`、`isHide`、`authList`
- **标签管理**：基于路由的标签创建，支持持久化
- **导航守卫**：登录检查、权限验证、主题应用
- **错误处理**：404/500 处理，优雅降级
- **进度指示**：NProgress 路由过渡效果

#### HTTP 层

- 在 `src/utils/http/index.ts` 中集中管理 Axios 实例
- 自动令牌注入和错误处理
- 可配置重试次数的请求重试机制
- 401 错误防抖，防止多次登出调用
- FormData 和 JSON 内容类型处理

#### 组件架构

- 从 `src/components/` 自动导入组件
- Element Plus 组件自动解析
- 在 `src/types/components.d.ts` 中自动生成类型定义
- 权限和 UI 效果的全局指令

## 组件库

⚠️ **重要**：使用 UI 组件、构建新功能或修改现有组件功能时，**务必先阅读 `COMPONENT_LIBRARY.md`** 获取完整文档。

### 快速概览

项目拥有包含 50+ 组件的综合组件库，分为：

- **核心组件** (`src/components/core/`) - 跨 12 个类别的系统组件
- **自定义组件** (`src/components/custom/`) - 开发者特定组件

### 主要组件类别

1. **布局组件** - 应用结构和导航
2. **图表组件** - 高级 ECharts 数据可视化
3. **表单组件** - 增强的表单控件和验证
4. **表格组件** - 具有高级功能的数据表格
5. **卡片组件** - 数据显示和统计
6. **媒体组件** - 视频、图像和媒体处理
7. **文本效果组件** - 动画文本显示
8. **菜单组件** - 导航系统

### 何时阅读组件库文档

**阅读 `COMPONENT_LIBRARY.md` 当：**

- 构建新的 UI 功能或页面
- 修改现有组件行为
- 创建新组件
- 调试组件相关问题
- 需要详细的属性信息
- 使用图表或高级组件
- 实现响应式设计
- 添加无障碍功能
- 优化组件性能

**组件库文档包括：**

- 完整的属性接口和默认值
- 高级功能和集成细节
- 性能考虑和最佳实践
- TypeScript 使用模式
- 主题集成指南
- 响应式设计实现
- 无障碍要求
- 常见问题故障排除

### 组件特性

#### 自动导入系统

- 所有组件自动导入并全局可用
- 自动生成 TypeScript 定义
- 无需手动导入语句
- 支持树摇优化

#### 主题集成

- 所有组件支持亮/暗主题
- CSS 自定义属性支持动态主题
- 一致的设计系统
- 响应式断点

#### TypeScript 支持

- 所有属性的完整类型定义
- 适用时支持泛型类型
- IDE 自动补全
- 运行时类型检查

#### 无障碍功能

- ARIA 标签和属性
- 键盘导航支持
- 屏幕阅读器兼容性
- 焦点管理

#### 性能优化

- 重型组件懒加载
- 大列表虚拟滚动
- 防抖事件处理器
- 高效重渲染

#### 响应式设计

- 移动优先方法
- 基于断点的布局
- 触摸友好的交互
- 自适应组件大小
- `src/locales/langs/` 中的语言文件
- 动态语言切换，支持持久化偏好

### 目录结构洞察

#### `src/composables/`

可重用的组合函数：

- `useAuth.ts` - 认证逻辑
- `useTheme.ts` - 主题切换和管理
- `useChart.ts` - ECharts 配置
- `useCheckedColumns.ts` - 表格列可见性
- `useSystemInfo.ts` - 系统信息处理

#### `src/utils/`

具有特定职责的实用模块：

- `http/` - HTTP 客户端和错误处理
- `storage/` - 本地存储，支持版本控制和迁移
- `theme/` - 主题切换和 CSS 变量管理
- `navigation/` - 路由和标签管理工具
- `dataprocess/` - 数据转换和格式化

#### `src/types/`

全面的 TypeScript 定义：

- 来自 unplugin 导入的自动生成类型
- `api/` 中的 API 响应类型
- 路由类型扩展
- 存储状态类型

#### `src/directives/`

自定义 Vue 指令：

- `permission.ts` - 基于角色的元素可见性
- `highlight.ts` - 文本高亮效果
- `ripple.ts` - Material Design 波纹效果

### 构建配置

#### Vite 配置

- 路径别名支持干净导入（`@`、`@views`、`@utils` 等）
- Vue、Vue Router、Pinia 和 VueUse 的自动导入
- Element Plus 组件自动解析
- 生产优化：
  - Terser 压缩，移除控制台
  - 供应商代码手动分块
  - Gzip 压缩
  - CSS 优化

#### 开发特性

- 热模块替换 (HMR)
- Vue DevTools 集成
- 路由更改进度指示器
- 异步操作加载状态

### 权限系统

#### 双权限模式

1. **前端模式**：本地定义路由，按用户角色过滤
2. **后端模式**：从 API 动态获取路由

#### 权限控制

- `src/router/guards/` 中的路由级守卫
- 组件级 `v-permission` 指令
- 基于用户角色的菜单可见性
- 通过 JWT 令牌进行 API 请求认证

### 存储策略

#### 版本化存储

- 通过 `StorageKeyManager` 自动版本控制
- 版本间数据迁移
- 清理旧存储键
- 存储可用性兼容性检查

#### 持久化数据

- 用户偏好和设置
- 认证令牌
- UI 状态（主题、语言、布局）
- 工作标签状态和导航历史

### 错误处理

#### HTTP 错误

- HTTP 拦截器中的集中错误处理
- 瞬时故障自动重试
- 通过 i18n 提供用户友好的错误消息
- 认证失败的优雅处理

#### 路由错误

- 未知路由的 404 处理
- 服务器错误的 500 错误页面
- 带错误边界的路由守卫
- 异步路由解析的加载状态

### 主题系统

#### 主题切换

- 亮/暗主题支持
- CSS 自定义属性支持动态主题
- 主题间平滑过渡
- Element Plus 主题定制
- 持久化主题偏好

#### CSS 架构

- 现代编译器的 SCSS
- 全局变量和混合器
- 组件作用域样式
- 响应式设计工具

### 代码标准

#### TypeScript

- 严格类型检查
- 全面的类型定义
- 自动导入类型生成
- API 响应类型安全

#### Vue 模式

- 使用 `<script setup>` 的 Composition API
- 适当的响应式状态管理
- 可重用逻辑的组合函数
- 类型安全的组件属性和事件

#### API 设计

- RESTful API 约定
- 基于 API 服务的类
- 请求/响应的 TypeScript 接口
- 集中错误处理

### 移动端优化

#### 响应式设计

- 移动优先的 CSS 方法
- 触摸事件处理
- 自适应布局和组件
- 移动设备性能优化

#### 移动功能

- 触摸友好的 UI 组件
- 滑动手势支持
- `mobile.scss` 中的移动特定样式
- 视口元标签管理

### 开发工作流

#### Git 工作流

- 功能分支开发
- 约定式提交消息
- 代码质量的提交前钩子
- 自动化代码检查和格式化

#### 测试策略

- 组件测试就绪（框架已就位）
- `src/mock/` 中的 API 模拟能力
- 开发时数据模拟
- 错误边界测试

## 文件同步要求

⚠️ **重要提醒**：每次更新 `CLAUDE.md` 文件时，**必须同步更新** `CLAUDE_ZH.md` 文件，确保两个文件的内容保持一致和最新。

### 同步规则

1. **内容一致性**：两个文件应包含相同的技术信息和架构描述
2. **语言差异**：`CLAUDE.md` 使用英文，`CLAUDE_ZH.md` 使用中文
3. **更新时机**：任何对项目架构、命令、或重要配置的更改都需要同步更新
4. **格式保持**：保持相同的 Markdown 结构和格式
5. **版本控制**：两个文件应作为一个整体进行版本管理

### 同步检查清单

更新 `CLAUDE.md` 后，请检查：

- [ ] 架构描述是否准确翻译
- [ ] 技术术语是否正确对应
- [ ] 命令和路径是否完全一致
- [ ] 代码示例是否保持原样
- [ ] 格式和结构是否保持一致
- [ ] 重要提醒和警告是否包含

## 重要指令提醒

请遵循以下核心指令：

- 完成被要求的任务；不多不少
- 除非绝对必要，否则不要创建文件
- 优先编辑现有文件而不是创建新文件
- 除非用户明确要求，否则不要主动创建文档文件（\*.md）或 README 文件
