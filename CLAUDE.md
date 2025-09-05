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
src/
├── components/             # Component library (core & custom)
├── composables/            # Reusable Vue 3 composition functions
├── views/                  # Page components
├── router/                 # Routing configuration
├── store/                  # Pinia state management
├── utils/                  # Utility functions
├── types/                  # TypeScript definitions
├── assets/                 # Static resources
└── locales/                # Internationalization
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
