import { RoutesAlias } from '../routesAlias'
import { AppRouteRecord } from '@/types/router'
import { WEB_LINKS } from '@/utils/constants'

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
        path: 'fetch',
        name: 'MaterialFetch',
        component: RoutesAlias.MaterialFetch,
        meta: {
          title: 'menus.material.fetch',
          keepAlive: true,
          authList: [
            {
              title: '抓取',
              authMark: 'fetch'
            }
          ]
        }
      },
      {
        path: 'fetch/mainstream',
        name: 'MaterialFetchMainstream',
        component: RoutesAlias.MaterialFetchMainstream,
        meta: {
          title: 'menus.material.fetchMainstream',
          keepAlive: true,
          isHide: true,
          activePath: '/material/fetch',
          authList: [
            {
              title: '主流媒体抓取',
              authMark: 'fetch-mainstream'
            }
          ]
        }
      },
      {
        path: 'fetch/external',
        name: 'MaterialFetchExternal',
        component: RoutesAlias.MaterialFetchExternal,
        meta: {
          title: 'menus.material.fetchExternal',
          keepAlive: true,
          isHide: true,
          activePath: '/material/fetch',
          authList: [
            {
              title: '外部素材抓取',
              authMark: 'fetch-external'
            }
          ]
        }
      },
      {
        path: 'upload',
        name: 'MaterialUpload',
        component: RoutesAlias.MaterialUpload,
        meta: {
          title: 'menus.material.upload',
          keepAlive: true,
          authList: [
            {
              title: '上传',
              authMark: 'upload'
            }
          ]
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
      },
      {
        path: 'edit/:id',
        name: 'MaterialEdit',
        component: RoutesAlias.MaterialEdit,
        meta: {
          title: 'menus.material.edit',
          keepAlive: true,
          isHide: true,
          activePath: '/material/management',
          authList: [
            {
              title: '编辑',
              authMark: 'edit'
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
        path: 'requirements/:projectId',
        name: 'DocumentRequirements',
        component: RoutesAlias.DocumentRequirements,
        meta: {
          title: 'menus.documentGeneration.requirements',
          keepAlive: true,
          isHide: true,
          activePath: '/document-generation/project-list'
        }
      },
      {
        path: 'title/:projectId',
        name: 'DocumentTitle',
        component: RoutesAlias.DocumentTitle,
        meta: {
          title: 'menus.documentGeneration.title',
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
