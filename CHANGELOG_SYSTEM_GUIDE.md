# 📋 项目变更日志系统使用指南

## 🎯 系统概述

本项目已成功配置了自动化的变更日志系统，能够自动跟踪和记录项目的所有变更，并且这些变更会出现在 Git 的"更改"中，需要您手动提交。

## ✅ 已解决的问题

1. **变更日志自动更新** - 每次 Git 提交后自动更新
2. **Git 跟踪** - 变更日志文件会被 Git 跟踪，出现在"更改"中
3. **手动提交** - 不会自动提交到 Git，需要您手动提交
4. **统计功能** - 自动统计各种类型的变更数量
5. **格式化输出** - 生成标准化的变更记录

## 🚀 工作流程

### 1. 正常开发流程

```bash
# 1. 修改代码
# 2. 提交代码
git add .
git commit -m "feat: 添加新功能"

# 3. 系统自动更新变更日志
# 4. 变更日志文件出现在 Git 更改中
# 5. 您手动提交变更日志
git add src/views/PROJECT_CHANGELOG.md
git commit -m "docs: 更新项目变更日志"
```

### 2. 查看变更日志

- **文件位置**: `src/views/PROJECT_CHANGELOG.md`
- **自动更新**: 每次提交后自动更新
- **Git 跟踪**: 会出现在 Git 的"更改"中

## 📊 变更类型统计

系统会自动统计以下类型的变更：

| 类型     | 图标 | 描述      | 统计字段  |
| -------- | ---- | --------- | --------- |
| feat     | ✅   | 新增功能  | 功能新增  |
| fix      | 🔧   | 修复问题  | 问题修复  |
| docs     | 📝   | 文档更新  | 文档更新  |
| style    | 🎨   | 样式调整  | 样式调整  |
| refactor | 🔄   | 代码重构  | 代码重构  |
| test     | 🧪   | 测试相关  | 测试相关  |
| chore    | ⚙️   | 构建/工具 | 构建/工具 |
| remove   | ❌   | 删除功能  | 删除功能  |

## 🔧 技术实现

### 1. 核心文件

- **变更日志**: `src/views/PROJECT_CHANGELOG.md`
- **更新脚本**: `scripts/update-changelog.ts`
- **Git 钩子**: `.husky/post-commit`
- **追踪文件**: `.last-changelog-commit` (仅本地)

### 2. 自动触发

- **触发时机**: 每次 `git commit` 后
- **执行流程**: `post-commit` → `changelog:update` → 更新文档
- **Git 状态**: 变更日志文件会出现在"更改"中

### 3. 配置说明

- **Git 跟踪**: 从 `.gitignore` 中移除了变更日志文件
- **自动更新**: 通过 `post-commit` 钩子自动触发
- **手动提交**: 需要您手动提交变更日志文件

## 📝 使用示例

### 示例 1: 正常功能开发

```bash
# 1. 开发功能
# 修改 src/views/example/index.vue

# 2. 提交代码
git add .
git commit -m "feat: 添加用户管理页面"

# 3. 系统自动更新变更日志
# 4. 查看 Git 状态
git status
# 输出: 修改：     src/views/PROJECT_CHANGELOG.md

# 5. 提交变更日志
git add src/views/PROJECT_CHANGELOG.md
git commit -m "docs: 更新项目变更日志"
```

### 示例 2: 修复问题

```bash
# 1. 修复问题
# 修改 src/utils/helper.ts

# 2. 提交代码
git add .
git commit -m "fix: 修复数据验证逻辑错误"

# 3. 系统自动更新变更日志
# 4. 提交变更日志
git add src/views/PROJECT_CHANGELOG.md
git commit -m "docs: 更新项目变更日志"
```

## 🎉 系统优势

1. **自动化**: 无需手动维护变更日志
2. **标准化**: 遵循 Conventional Commits 规范
3. **可视化**: 清晰的变更记录和统计
4. **可控性**: 变更日志需要手动提交，避免污染版本历史
5. **完整性**: 记录所有类型的变更和影响文件

## 🔍 故障排除

### 问题 1: 变更日志没有自动更新

```bash
# 检查 post-commit 钩子
cat .husky/post-commit

# 手动运行更新脚本
pnpm changelog:update
```

### 问题 2: 变更日志没有出现在 Git 更改中

```bash
# 检查 .gitignore 文件
grep PROJECT_CHANGELOG .gitignore

# 确保文件没有被忽略
git check-ignore src/views/PROJECT_CHANGELOG.md
```

### 问题 3: 统计信息不准确

```bash
# 检查 .last-changelog-commit 文件
cat .last-changelog-commit

# 手动重置（会重新处理所有提交）
rm .last-changelog-commit
pnpm changelog:update
```

## 📞 技术支持

如遇到问题，请：

1. **检查日志**: 查看控制台输出
2. **检查配置**: 确认 Git 和 Node.js 环境
3. **手动测试**: 运行 `pnpm changelog:update`
4. **检查文件**: 确认变更日志文件存在且可写

---

**最后更新**: 2025年1月11日  
**版本**: v1.0.0  
**维护者**: MCY
