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

**Development & Build:**

- `pnpm dev` - Start development server with hot reload and auto-open browser
- `pnpm build` - Build for production with TypeScript compilation
- `pnpm serve` - Preview production build locally

**Code Quality:**

- `pnpm lint` - Run ESLint for code quality checks
- `pnpm fix` - Auto-fix ESLint issues
- `pnpm lint:prettier` - Format code with Prettier across all file types
- `pnpm lint:stylelint` - Fix SCSS/CSS style issues
- `pnpm lint:lint-staged` - Run lint-staged for pre-commit hooks

**Development Tools:**

- `pnpm commit` - Interactive commit with git-cz (Commitizen)
- `pnpm clean:dev` - Clean development cache and temporary files
- `pnpm prepare` - Setup Husky git hooks

## Advanced Feature Systems

### Material Library with AI Search

- **AI-Enhanced Search**: DeepSeek integration for intelligent material search
- **Search Progress Visualization**: Real-time search progress components
- **Material Card System**: Unified material display with batch management
- **API Integration**: `@ai_api/search-tools` for advanced search capabilities

### AI Document Generation

- **5-Step Workflow**: Project list → Requirements → Title → Outline → Content
- **AI Integration**: Complete AI-powered document creation with localStorage persistence
- **Rich Text Editing**: WangEditor integration with AI suggestions
- **State Management**: Vue 3 reactive system with project-specific storage

### API Management System

- **Centralized Configuration**: All APIs managed in `src/config/api/index.ts`
- **Mock/Real Switching**: Runtime API switching with floating toggle button
- **Development Tools**: Global debugging via `window.__DEV_TOOLS__`
- **Type Safety**: Complete TypeScript integration with OpenAPI specifications

## Component Library

⚠️ **CRITICAL**: When working with UI components, building new features, or modifying existing component functionality, **ALWAYS read `COMPONENT_LIBRARY.md` first** for comprehensive documentation.

### Auto-Import System

- **Components**: All components in `src/components/` are auto-imported
- **Composables**: VueUse, Vue Router, Pinia functions auto-imported
- **Element Plus**: Components and icons auto-imported
- **Type Safety**: Auto-generated TypeScript definitions

### Key Component Categories

**Layout Components:**

- `ArtLayouts` - Main layout with responsive design
- `ArtHeaderBar` - Top navigation with global search and notifications
- `ArtWorkTab` - Multi-tab navigation with persistent state
- `ArtBreadcrumb` - Dynamic breadcrumb navigation

**Chart Components:**

- Comprehensive ECharts wrappers (bar, line, pie, radar, scatter, map)
- Responsive design with theme integration
- Performance optimized with lazy loading

**Form Components:**

- Enhanced search bars with advanced filtering
- Excel import/export functionality
- Rich text editor (WangEditor) integration
- Drag verification components

## Project Architecture

### Technology Stack

- **Vue 3** with Composition API and `<script setup>` syntax
- **TypeScript** with strict mode for full type safety
- **Vite** for fast development and optimized builds
- **Element Plus** as primary UI component library
- **Pinia** for state management with persistence
- **Vue Router 4** with hash history
- **SCSS** with CSS custom properties for theming

### Directory Structure

```
src/
├── components/          # Auto-imported components
│   ├── core/           # System components (layouts, charts, tables)
│   ├── custom/         # Feature-specific components
│   └── dev/            # Development tools
├── config/api/         # Centralized API configuration
├── services/           # Business logic and API services
├── store/              # Pinia state management
├── utils/              # Utility functions
├── views/              # Page components
└── types/              # TypeScript definitions
```

### API Architecture

- **Service-Based Organization**: Modular API services in `src/services/`
- **Base Service Class**: `BaseApiService` for consistent patterns
- **HTTP Client**: Advanced Axios wrapper with retry, caching, and error handling
- **Type Safety**: Full TypeScript integration with request/response types

### State Management

- **Modular Pinia Stores**: Separate stores for different concerns
- **Persistence**: Automatic localStorage synchronization with versioning
- **Key Stores**: `user`, `setting`, `menu`, `worktab`, `table`

## Development Guidelines

### Page Development

- Create pages in `src/views/` with appropriate subdirectories
- Use `<script setup>` syntax for Vue 3 Composition API
- Follow TypeScript strict mode requirements
- Ensure mobile responsiveness with mobile-first approach

### Code Quality

- **TypeScript Strict Mode**: Full type safety required
- **ESLint + Prettier**: Consistent code formatting
- **Husky + lint-staged**: Pre-commit quality checks
- **Commitizen**: Standardized commit message format

### Testing Requirements

- Test with both light and dark themes
- Ensure mobile responsiveness
- Verify internationalization for user-facing text
- Test API switching between mock and real endpoints

### Key Directives

- `v-permission` - Role-based element visibility
- `v-highlight` - Text highlighting effects
- `v-ripple` - Material Design ripple effects

## Development Tools & Debugging

### Global Development Tools

Access via `window.__DEV_TOOLS__`:

- API configuration inspection
- Mock/real API switching
- Request/response monitoring
- Performance debugging

### Keyboard Shortcuts

- Development mode shortcuts for common operations
- Theme switching hotkeys
- Component inspection tools

## Performance & Optimization

### Build Optimizations

- Vite for fast development and optimized production builds
- Component lazy loading with route-based code splitting
- Tree shaking for dead code elimination
- Gzip compression for assets

### Runtime Optimizations

- Virtual scrolling for large data tables
- Debounced search inputs
- Memoized computed properties
- Efficient re-rendering with Vue 3 reactivity

## Important Conventions

### Component Development

- Follow existing component patterns in `src/components/core/`
- Use CSS custom properties for theming
- Implement proper TypeScript interfaces
- Include accessibility considerations

### API Development

- Use the centralized API configuration system
- Implement proper error handling with user-friendly messages
- Add appropriate request caching when beneficial
- Follow service-based architecture patterns

### State Management

- Use Pinia stores for shared state
- Implement proper store persistence with versioning
- Follow reactive patterns with Vue 3 Composition API
- Use composables for reusable logic

This architecture represents a mature, enterprise-grade Vue 3 application with comprehensive tooling, type safety, and developer experience optimizations. The modular design and extensive component library make it suitable for rapid development of complex admin interfaces while maintaining code quality and consistency.
