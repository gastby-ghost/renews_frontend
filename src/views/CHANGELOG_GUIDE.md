# 📋 项目变更跟踪系统使用指南

## 🎯 系统概述

本项目集成了自动化的变更跟踪系统，能够自动记录和同步所有代码变更，为项目管理提供完整的变更历史。

### 📋 工作原理

- **自动检测**: 每次 Git 提交后自动触发
- **智能更新**: 自动分析提交记录并更新变更日志
- **实时同步**: 文档内容与代码变更实时同步
- **版本控制**: 变更日志自动提交到 Git，使用 [skip ci] 标记避免 CI 触发

## 🏗️ 系统架构

```
变更跟踪系统
├── PROJECT_CHANGELOG.md     # 主变更日志文档
├── update-changelog.ts      # 自动更新脚本
├── post-commit hook        # Git 提交后钩子
└── CHANGELOG_GUIDE.md      # 使用指南 (本文档)
```

## 🚀 功能特性

### ✅ 自动化功能

- **自动提交检测**: 每次 Git 提交后自动触发
- **智能分类**: 根据提交信息自动分类变更类型
- **文件追踪**: 自动记录影响的文件路径
- **格式化输出**: 生成标准化的变更记录
- **自动提交**: 变更日志自动提交到 Git，使用 [skip ci] 标记

### 📊 支持的变更类型

| 类型     | 图标 | 描述      | 示例提交信息             |
| -------- | ---- | --------- | ------------------------ |
| feat     | ✅   | 新增功能  | `feat: 添加用户管理模块` |
| fix      | 🔧   | 修复问题  | `fix: 修复登录验证错误`  |
| docs     | 📝   | 文档更新  | `docs: 更新API文档`      |
| style    | 🎨   | 样式调整  | `style: 优化按钮样式`    |
| refactor | 🔄   | 代码重构  | `refactor: 重构用户服务` |
| test     | 🧪   | 测试相关  | `test: 添加单元测试`     |
| chore    | ⚙️   | 构建/工具 | `chore: 更新依赖包`      |
| remove   | ❌   | 删除功能  | `remove: 删除废弃组件`   |

## 📝 使用方法

### 1. 标准提交流程

使用标准化的提交信息格式：

```bash
# 推荐：使用 commitizen 进行规范化提交
pnpm commit

# 或者手动使用标准格式
git commit -m "feat(auth): 添加双因素认证功能"
```

### 2. 提交信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**示例：**

```bash
feat(material): 添加素材批量上传功能

- 支持多文件选择
- 添加上传进度显示
- 支持文件类型验证

Closes #123
```

### 3. 手动更新变更日志

如果需要手动触发更新：

```bash
# 更新变更日志
pnpm changelog:update

# 手动模式（交互式）
pnpm changelog:manual
```

### 4. 查看变更历史

变更记录保存在：

- **主文档**: `src/views/PROJECT_CHANGELOG.md` (自动提交到 Git)
- **提交追踪**: `.last-changelog-commit` (Git 哈希，仅本地)

## ⚙️ 配置选项

### 自定义脚本参数

在 `scripts/update-changelog.ts` 中可以配置：

```typescript
// 修改变更日志路径
private changelogPath = join(process.cwd(), 'src/views/PROJECT_CHANGELOG.md')

// 修改追踪文件路径
private lastCommitFile = join(process.cwd(), '.last-changelog-commit')

// 自定义提交范围
const range = lastCommit ? `${lastCommit}..HEAD` : 'HEAD~10..HEAD'
```

### Git Hook 配置

在 `.husky/post-commit` 中可以配置：

```bash
# 禁用自动更新（注释掉相关行）
# pnpm changelog:update

# 注意：变更日志会自动提交到 Git，使用 [skip ci] 标记避免 CI 触发
# 这确保变更历史完整记录在版本控制中
```

## 🔍 故障排除

### 常见问题

#### 1. Hook 不执行

```bash
# 确保 hook 有执行权限
chmod +x .husky/post-commit

# 重新安装 husky
pnpm prepare
```

#### 2. 脚本执行失败

```bash
# 检查 tsx 是否安装
pnpm list tsx

# 手动运行脚本测试
pnpm tsx scripts/update-changelog.ts
```

#### 3. Git 日志解析错误

```bash
# 检查 Git 配置
git config --list

# 确保提交信息编码正确
git config core.quotepath false
```

### 调试模式

启用详细日志输出：

```bash
# 设置调试环境变量
DEBUG=changelog pnpm changelog:update

# 或在脚本中添加调试信息
console.log('Debug info:', { commits, entries })
```

## 📈 最佳实践

### 1. 提交信息规范

- **使用英文动词**: add, fix, update, remove
- **描述具体**: 说明具体做了什么
- **包含范围**: 指明影响的模块
- **简洁明了**: 控制在 50 字符内

### 2. 频率建议

- **小步提交**: 每个功能点单独提交
- **及时提交**: 不要积累太多变更
- **描述清晰**: 让其他人能理解变更内容

### 3. 文档维护

- **定期检查**: 每周检查变更日志准确性
- **手动补充**: 重要变更可手动添加详细说明
- **版本标记**: 在重要版本发布时添加标记

## 🔗 相关文档

- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Commitizen 使用指南](https://github.com/commitizen/cz-cli)
- [Husky Git Hooks](https://typicode.github.io/husky/)
- [项目主变更日志](./PROJECT_CHANGELOG.md)

## 📞 技术支持

如遇到问题，请：

1. **查看日志**: 检查控制台输出
2. **检查配置**: 确认 Git 和 Node.js 环境
3. **手动测试**: 运行单个命令测试
4. **联系维护者**: 提供详细的错误信息

---

**最后更新**: 2025年9月11日  
**版本**: v1.0.0  
**维护者**: MCY
