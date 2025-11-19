import { RoutesAlias } from '../routesAlias'
import { AppRouteRecord } from '@/types/router'

/**
 * 菜单列表、异步路由
 *
 * 支持两种模式:
 * 前端静态配置 - 直接使用本文件中定义的路由配置
 * 后端动态配置 - 后端返回菜单数据，前端解析生成路由
 *
 * 菜单标题（title）:
 * 可以是 i18n 的 key，也可以是字符串，比如：'用户列表'
 *
 * 注意事项：
 * 1、RoutesAlias.Layout 指向的是布局容器，后端返回的菜单数据中，component 字段需要指向 /index/index
 * 2、path、name 不要和动态路由冲突，否则会导致路由冲突无法访问
 */
export const asyncRoutes: AppRouteRecord[] = [
  // 主页一级菜单配置示例：
  // {
  //   name: 'Home',
  //   path: '/home',
  //   component: RoutesAlias.Dashboard,
  //   meta: {
  //     title: 'menus.dashboard.console',
  //     icon: '&#xe733;',
  //     keepAlive: false
  //   }
  // },

  {
    path: '/welcome',
    name: 'Welcome',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.welcome.introduce',
      icon: '&#xe733;',
      keepAlive: true
    },
    redirect: '/welcome/index',
    children: [
      {
        path: 'index',
        name: 'WelcomeIndex',
        component: RoutesAlias.Welcome,
        meta: {
          title: 'menus.welcome.architecture',
          keepAlive: true
        }
      }
    ]
  },
  {
    path: '/material',
    name: 'Material',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.material.title',
      icon: '&#xe651;',
      showTextBadge: 'New'
    },
    children: [
      {
        path: 'search',
        name: 'MaterialSearch',
        component: RoutesAlias.MaterialSearch,
        meta: {
          title: 'menus.material.search',
          keepAlive: true,
          showTextBadge: 'AI'
        }
      },
      {
        path: 'management',
        name: 'MaterialManagement',
        component: RoutesAlias.MaterialManagement,
        meta: {
          title: 'menus.material.management',
          keepAlive: true,
          authList: [
            {
              title: '管理',
              authMark: 'manage'
            },
            {
              title: '删除',
              authMark: 'delete'
            }
          ]
        }
      }
    ]
  },
  {
    path: '/document-generation',
    name: 'DocumentGeneration',
    component: RoutesAlias.Layout,
    meta: {
      title: 'menus.documentGeneration.title',
      icon: '&#xe8a8;',
      showTextBadge: 'AI'
    },
    children: [
      {
        path: 'project-list',
        name: 'DocumentProjectList',
        component: RoutesAlias.DocumentGeneration,
        meta: {
          title: 'menus.documentGeneration.projectList',
          keepAlive: true
        }
      },
      {
        path: 'topic-selection/:projectId',
        name: 'DocumentTopicSelection',
        component: RoutesAlias.DocumentTopicSelection,
        meta: {
          title: 'menus.documentGeneration.topicSelection',
          keepAlive: true,
          isHide: true,
          activePath: '/document-generation/project-list'
        }
      },
      {
        path: 'outline/:projectId',
        name: 'DocumentOutline',
        component: RoutesAlias.DocumentOutline,
        meta: {
          title: 'menus.documentGeneration.outline',
          keepAlive: true,
          isHide: true,
          activePath: '/document-generation/project-list'
        }
      },
      {
        path: 'content/:projectId',
        name: 'DocumentContent',
        component: RoutesAlias.DocumentContent,
        meta: {
          title: 'menus.documentGeneration.content',
          keepAlive: true,
          isHide: true,
          activePath: '/document-generation/project-list'
        }
      }
    ]
  }
]
