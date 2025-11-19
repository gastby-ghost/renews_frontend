/**
 * 路由别名，方便快速找到页面，同时可以用作路由跳转
 */

/** 路由别名 */
export enum RoutesAlias {
  Layout = '/index/index', // 布局容器
  Login = '/auth/login', // 登录
  Register = '/auth/register', // 注册
  ForgetPassword = '/auth/forget-password', // 忘记密码
  VerifyEmail = '/auth/verify-email', // 邮件验证
  Exception404 = '/exception/404', // 404
  Welcome = '/welcome', // 欢迎页面
  MaterialSearch = '/material/search', // 素材检索
  MaterialManagement = '/material/management', // 素材管理
  // 文档生成 - AI创作
  DocumentGeneration = '/document-generation/project-list', // 项目列表
  DocumentTopicSelection = '/document-generation/topic-selection', // 选题策划（需求定义和标题选择）
  DocumentOutline = '/document-generation/outline', // 大纲
  DocumentContent = '/document-generation/content' // 正文
}
