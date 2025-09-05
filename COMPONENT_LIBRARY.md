# Component Library Documentation

This document provides comprehensive information about the Art Design Pro component library. **Read this file when working with UI components, building new features, or modifying existing component functionality.**

## Overview

The project features a comprehensive component library divided into **core** (system components) and **custom** (developer components) categories. All components are auto-imported and available globally with full TypeScript support.

## Core Components (`src/components/core/`)

### Layout Components (`layouts/`)

#### ArtLayouts - Main layout container

- **Props**: None (uses global store settings)
- **Features**: Dynamic padding based on menu type, responsive design, theme-aware styling
- **Usage**: Root layout wrapper for all pages
- **Key Dependencies**: `useMenuStore`, `useSettingStore`, menu type enums

#### ArtHeaderBar - Top navigation bar with rich functionality

- **Props**: None (configurable via settings panel)
- **Features**:
  - Menu toggle, refresh button, breadcrumb navigation
  - Global search (Ctrl/Cmd + K), fullscreen toggle
  - Notification center, chat window, language switcher
  - Theme toggle (light/dark), settings panel
  - User menu with avatar, quick actions, logout
- **Integrations**: VueUse fullscreen, i18n, Pinia stores
- **Key Dependencies**: `useHeaderBar` composable, `useFullscreen`, `useWindowSize`

#### ArtWorkTab - Multi-tab navigation system

- **Props**: None (managed via worktab store)
- **Features**: Tab management, route history, tab context menu
- **Storage**: Persistent tab state across sessions
- **Key Dependencies**: `useWorktabStore`, tab configuration utilities

#### ArtBreadcrumb - Dynamic breadcrumb navigation

- **Props**: None (auto-generated from route meta)
- **Features**: Route-based breadcrumbs, clickable navigation
- **Key Dependencies**: Route meta information, navigation utilities

### Menu Components (`layouts/art-menus/`)

#### ArtSidebarMenu - Vertical sidebar navigation

- **Props**: `list` (menu items array), `mode` (vertical/horizontal)
- **Features**: Multi-level nesting, icons, badges, collapsed state
- **Subcomponents**: `SidebarSubmenu` for nested items
- **Key Dependencies**: Menu store, route navigation

#### ArtHorizontalMenu - Horizontal top navigation

- **Props**: `list` (menu items array)
- **Features**: Dropdown submenus, responsive design
- **Key Dependencies**: Element Plus dropdown, responsive utilities

#### ArtMixedMenu - Hybrid menu system

- **Props**: `list` (menu items array)
- **Features**: Combines horizontal and vertical menu styles
- **Key Dependencies**: Mixed layout logic, menu state management

### Card Components (`cards/`)

#### ArtStatsCard - Statistical data display card

- **Props**: `icon`, `title`, `count`, `description`, `backgroundColor`, `iconColor`, `iconBgColor`, `iconSize`, `iconBgRadius`, `textColor`, `decimals`, `separator`, `showArrow`
- **Features**: Animated number counting, customizable styling, icon integration
- **Key Dependencies**: `ArtCountTo` component, CSS custom properties

#### ArtProgressCard - Progress indicator card

- **Props**: `title`, `percentage`, `color`, `showText`, `strokeWidth`, `textColor`
- **Features**: Circular or linear progress, customizable colors
- **Key Dependencies**: Element Plus progress component

#### ArtDataListCard - Data list display card

- **Props**: `title`, `data`, `showIcon`, `iconField`, `titleField`, `subtitleField`
- **Features**: Scrollable lists, custom item rendering
- **Key Dependencies**: List utilities, icon components

#### ArtImageCard - Image display card

- **Props**: `title`, `imageUrl`, `description`, `actionText`, `height`, `fit`
- **Features**: Image loading states, hover effects
- **Key Dependencies**: Image loading utilities, CSS transitions

#### ArtTimelineListCard - Timeline display card

- **Props**: `title`, `items`, `timestampField`, `titleField`, `contentField`
- **Features**: Vertical timeline, custom item templates
- **Key Dependencies**: Timeline utilities, date formatting

### Chart Components (`charts/`)

#### ArtLineChart - Advanced line chart with animations

- **Props**: `height`, `loading`, `isEmpty`, `colors`, `data`, `xAxisData`, `lineWidth`, `showAreaColor`, `smooth`, `symbol`, `symbolSize`, `animationDelay`, `showAxisLabel`, `showAxisLine`, `showSplitLine`, `showTooltip`, `showLegend`, `legendPosition`
- **Features**: Multi-series support, area fills, smooth curves, step animations, theme-aware styling
- **Integrations**: ECharts, VueUse, theme system
- **Key Dependencies**: `useChart` composable, ECharts library, theme utilities

#### ArtBarChart - Bar chart component

- **Props**: Similar to line chart with bar-specific options
- **Features**: Horizontal/vertical bars, stacked bars, grouped bars
- **Key Dependencies**: ECharts bar series configuration

#### ArtDonutChart - Donut/pie chart component

- **Props**: `data`, `colors`, `showLegend`, `centerText`
- **Features**: Animated rendering, custom center text, legend positioning
- **Key Dependencies**: ECharts pie series, animation utilities

#### ArtRingChart - Ring chart component

- **Props**: Similar to donut chart with ring-specific styling
- **Features**: Multiple ring layers, customizable inner radius
- **Key Dependencies**: ECharts pie series with ring configuration

#### ArtRadarChart - Radar/spider chart component

- **Props**: `data`, `indicators`, `colors`, `fillColor`
- **Features**: Multi-axis data comparison, filled areas
- **Key Dependencies**: ECharts radar series, indicator configuration

#### ArtScatterChart - Scatter plot component

- **Props**: `data`, `xAxisData`, `symbolSize`, `colors`
- **Features**: Bubble sizing, color coding, trend lines
- **Key Dependencies**: ECharts scatter series, symbol management

#### ArtMapChart - Geographic map visualization

- **Props**: `mapData`, `visualMap`, `zoom`, `center`
- **Features**: Interactive maps, heat maps, data clustering
- **Key Dependencies**: ECharts map series, geo configuration

#### ArtDualBarCompareChart - Dual-axis bar comparison chart

- **Props**: `leftData`, `rightData`, `leftName`, `rightName`, `colors`
- **Features**: Side-by-side comparison, dual y-axes
- **Key Dependencies**: ECharts dual y-axis configuration

#### ArtKLineChart - Financial K-line chart

- **Props**: `data`, `maPeriods`, `volume`, `colors`
- **Features**: Candlestick patterns, moving averages, volume bars
- **Key Dependencies**: ECharts candlestick series, financial utilities

#### ArtHBarChart - Horizontal bar chart

- **Props**: Similar to bar chart with horizontal orientation
- **Features**: Horizontal bars with custom ordering
- **Key Dependencies**: ECharts horizontal bar configuration

### Table Components (`tables/`)

#### ArtTable - Enhanced table with pagination

- **Props**: `columns`, `data`, `loading`, `showPagination`, `pagination`, `height`, `border`, `stripe`, `size`, `headerCellStyle`, `emptyText`
- **Features**:
  - Full Element Plus table compatibility
  - Custom column rendering with slots
  - Global indexing, expandable rows
  - Integrated pagination with position control
  - Empty state handling, loading states
  - Responsive design, column visibility control
- **Exposes**: `elTableRef` for direct table API access
- **Key Dependencies**: Element Plus table, pagination utilities, `useTableStore`

#### ArtTableHeader - Table header with actions

- **Props**: `title`, `actions`, `showSearch`, `searchPlaceholder`
- **Features**: Title display, action buttons, search functionality
- **Key Dependencies**: Action utilities, search integration

### Form Components (`forms/`)

#### ArtSearchBar - Advanced search form component

- **Props**: `modelValue`, `items`, `labelPosition`, `labelWidth`, `gutter`, `span`, `showExpand`, `expandText`, `collapseText`
- **Features**:
  - Dynamic form generation from configuration
  - Support for all Element Plus form components
  - Custom slots for form fields
  - Expandable form sections
  - Responsive grid layout
  - Built-in validation integration
- **Key Dependencies**: Element Plus form components, grid system, validation utilities

#### ArtWangEditor - Rich text editor

- **Props**: `height`, `toolbarKeys`, `insertKeys`, `excludeKeys`, `mode`, `placeholder`, `uploadConfig`
- **Features**:
  - WangEditor 5 integration
  - Custom toolbar configuration
  - Image upload with authentication
  - Custom icon theming
  - Full-screen mode
  - Emoji support
  - Auto-save functionality
- **Key Dependencies**: WangEditor 5, image upload utilities, icon system

#### ArtExcelExport - Excel export utility

- **Props**: `data`, `filename`, `sheetName`, `headers`
- **Features**: Client-side Excel export, custom formatting
- **Key Dependencies**: XLSX library, file utilities

#### ArtExcelImport - Excel import utility

- **Props**: `accept`, `maxSize`, `onSuccess`, `onError`
- **Features**: Excel file parsing, data validation
- **Key Dependencies**: XLSX library, file validation

#### ArtDragVerify - Drag verification component

- **Props**: `width`, `height`, `text`, `successText`, `onSuccess`
- **Features**: Slider verification, custom styling
- **Key Dependencies**: Drag utilities, event handling

#### ArtButtonMore - Load more button

- **Props**: `loading`, `disabled`, `text`, `loadingText`
- **Features**: Loading states, custom text
- **Key Dependencies**: Button utilities, loading states

#### ArtButtonTable - Table action button group

- **Props**: `actions`, `row`, `size`
- **Features**: Contextual actions, icon buttons
- **Key Dependencies**: Action utilities, icon system

### Media Components (`media/`)

#### ArtVideoPlayer - Video player component

- **Props**: `src`, `poster`, `autoplay`, `controls`, `loop`
- **Features**: Custom controls, fullscreen support
- **Key Dependencies**: Video player utilities, fullscreen API

#### ArtCutterImg - Image cropping tool

- **Props**: `src`, `width`, `height`, `onCrop`
- **Features**: Drag-to-crop, aspect ratio control
- **Key Dependencies**: Image manipulation utilities, drag handling

### Text Effect Components (`text-effect/`)

#### ArtCountTo - Animated number counter

- **Props**: `target`, `duration`, `decimals`, `separator`, `prefix`, `suffix`
- **Features**: Smooth counting animation, formatting options
- **Key Dependencies**: Animation utilities, number formatting

#### ArtTextScroll - Text scrolling/marquee

- **Props**: `text`, `speed`, `direction`, `pauseOnHover`
- **Features**: Horizontal/vertical scrolling, pause controls
- **Key Dependencies**: Scroll utilities, animation handling

#### ArtFestivalTextScroll - Festival-themed text scroll

- **Props**: Inherits from ArtTextScroll with festival styling
- **Features**: Holiday animations, themed decorations
- **Key Dependencies**: Festival utilities, theme system

### Banner Components (`banners/`)

#### ArtBasicBanner - Basic banner component

- **Props**: `title`, `subtitle`, `backgroundImage`, `height`
- **Features**: Simple banner with background image
- **Key Dependencies**: Image utilities, CSS background handling

#### ArtCardBanner - Card-style banner

- **Props**: `title`, `description`, `image`, `actionText`
- **Features**: Card layout, call-to-action buttons
- **Key Dependencies**: Card utilities, action handling

### Base Components (`base/`)

#### ArtLogo - Application logo component

- **Props**: `size`, `clickable`, `href`
- **Features**: Dynamic logo loading, click navigation
- **Key Dependencies**: Image utilities, navigation handling

#### ArtBackToTop - Scroll-to-top button

- **Props**: `visibilityHeight`, `right`, `bottom`, `duration`
- **Features**: Smooth scrolling, visibility threshold
- **Key Dependencies**: Scroll utilities, smooth scrolling

#### ArtIconSelector - Icon selection dialog

- **Props**: `modelValue`, `multiple`, `categories`
- **Features**: Icon search, category filtering, preview
- **Key Dependencies**: Icon system, search utilities, dialog handling

### Other Components (`others/`)

#### ArtWatermark - Watermark overlay

- **Props**: `text`, `fontColor`, `fontSize`, `gap`, `angle`
- **Features**: Full-page watermark, custom styling
- **Key Dependencies**: Canvas utilities, CSS positioning

#### ArtMenuRight - Right-click menu

- **Props**: `items`, `trigger`
- **Features**: Context menu, custom actions
- **Key Dependencies**: Event handling, menu utilities

### View Components (`views/`)

#### ArtException - Error page display

- **Props**: `status`, `title`, `description`, `actions`
- **Features**: 404/500 error pages, custom error states
- **Key Dependencies**: Error handling utilities, action handling

#### LoginLeftView - Login page left panel

- **Props**: `title`, `description`, `backgroundImage`
- **Features**: Branded login interface
- **Key Dependencies**: Authentication utilities, branding

#### ArtResultPage - Result/success page

- **Props**: `status`, `title`, `description`, `actions`
- **Features**: Success/failure result displays
- **Key Dependencies**: Result handling utilities, action handling

## Custom Components (`src/components/custom/`)

### CommentWidget (`comment-widget/`)

#### CommentWidget - Interactive comment system

- **Props**: None (uses internal state)
- **Features**:
  - Comment posting with author name
  - Nested reply system
  - Real-time comment display
  - Form validation
  - Local state management
- **Subcomponents**: `CommentItem` for individual comment rendering
- **Key Dependencies**: Comment utilities, form validation, state management

## Component Development Guidelines

### Creating New Components

1. **Naming Convention**: Use `Art` prefix for all components (e.g., `ArtNewComponent`)
2. **File Structure**: Place in appropriate category folder under `src/components/core/`
3. **TypeScript**: Always define props interfaces with proper typing
4. **Documentation**: Include JSDoc comments for props and methods
5. **Theming**: Use CSS custom properties for theme-aware styling
6. **Accessibility**: Include proper ARIA attributes and keyboard navigation

### Component Best Practices

1. **Props Design**: Use interfaces with clear descriptions and default values
2. **Event Handling**: Use Vue 3's `defineEmits` for proper type safety
3. **Slots**: Provide named slots for customization when appropriate
4. **Performance**: Use `shallowRef` for complex objects, `computed` for derived values
5. **Composition**: Extract reusable logic into composables when possible
6. **Testing**: Design components with testability in mind

### Theme Integration

All components should support both light and dark themes:

- Use CSS custom properties from the theme system
- Test appearance in both theme modes
- Provide theme-specific variants when necessary

### Responsive Design

- Mobile-first approach with appropriate breakpoints
- Touch-friendly interactions for mobile devices
- Adaptive layouts that work across screen sizes
- Use responsive utilities from the design system

## Common Component Patterns

### Auto-Import Setup

All components are automatically imported via Vite configuration:

```typescript
// vite.config.ts
Components({
  deep: true,
  extensions: ['vue'],
  dirs: ['src/components'],
  resolvers: [ElementPlusResolver()],
  dts: 'src/types/components.d.ts'
})
```

### Props Pattern

```typescript
interface ComponentProps {
  /** Prop description */
  propName: PropType
  /** Optional prop with default */
  optionalProp?: string
}

const props = withDefaults(defineProps<ComponentProps>(), {
  optionalProp: 'default value'
})
```

### Event Pattern

```typescript
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [event: Event]
  'custom-event': [payload: CustomPayload]
}>()
```

### Slot Pattern

```typescript
<template>
  <div class="component">
    <slot name="header" />
    <slot :item="item" /> <!-- Default slot with props -->
    <slot name="footer" />
  </div>
</template>
```

## Component Dependencies

### Core Dependencies

- **Vue 3**: Component framework with Composition API
- **Element Plus**: Base UI component library
- **TypeScript**: Type safety and developer experience
- **SCSS**: Styling with modern compiler

### Feature Dependencies

- **ECharts**: Chart and data visualization components
- **WangEditor 5**: Rich text editing functionality
- **VueUse**: Composition utilities for enhanced functionality
- **Pinia**: State management integration
- **Vue I18n**: Internationalization support

### Utility Dependencies

- **XLSX**: Excel import/export functionality
- **File-saver**: File download utilities
- **Crypto-js**: Encryption and security utilities
- **Highlight.js**: Code syntax highlighting

## Performance Considerations

### Lazy Loading

Heavy components like charts and editors should implement lazy loading:

```typescript
const HeavyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
```

### Virtual Scrolling

For large data sets, use virtual scrolling techniques:

```vue
<template>
  <VirtualList :items="largeDataSet" :item-size="50" />
</template>
```

### Debouncing

Implement debouncing for expensive operations:

```typescript
const debouncedSearch = debounce((query: string) => {
  // Expensive search operation
}, 300)
```

## Troubleshooting Common Issues

### Component Not Found

- Check if component is in correct directory structure
- Verify Vite auto-import configuration
- Ensure component follows naming conventions

### TypeScript Errors

- Check prop definitions and interfaces
- Verify auto-generated type definitions
- Ensure proper import/export statements

### Styling Issues

- Verify CSS custom properties usage
- Check theme integration
- Ensure proper SCSS compilation

### Performance Issues

- Check for unnecessary re-renders
- Verify proper use of reactive references
- Consider lazy loading for heavy components
