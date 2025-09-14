#!/usr/bin/env tsx

/**
 * 项目变更日志自动更新脚本
 * 用于跟踪和记录项目的所有变更
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface ChangeLogEntry {
  date: string
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'remove'
  scope?: string
  description: string
  files: string[]
  author: string
  hash: string
}

class ChangeLogUpdater {
  private changelogPath = join(process.cwd(), 'src/views/PROJECT_CHANGELOG.md')
  private lastCommitFile = join(process.cwd(), '.last-changelog-commit')

  constructor() {
    console.log('🚀 启动项目变更日志更新器...')
  }

  /**
   * 获取最后一次更新的提交哈希
   */
  private getLastCommitHash(): string {
    try {
      if (existsSync(this.lastCommitFile)) {
        return readFileSync(this.lastCommitFile, 'utf-8').trim()
      }
      return ''
    } catch {
      console.warn('⚠️ 无法读取最后提交记录，将处理所有提交')
      return ''
    }
  }

  /**
   * 保存最后一次处理的提交哈希
   */
  private saveLastCommitHash(hash: string): void {
    writeFileSync(this.lastCommitFile, hash)
  }

  /**
   * 获取新的提交记录
   */
  private getNewCommits(): ChangeLogEntry[] {
    const lastCommit = this.getLastCommitHash()
    const range = lastCommit ? `${lastCommit}..HEAD` : 'HEAD~10..HEAD'

    try {
      const gitLog = execSync(
        `git log ${range} --pretty=format:"%H|%ad|%an|%s" --date=short --name-only`,
        { encoding: 'utf-8' }
      )

      if (!gitLog.trim()) {
        console.log('✅ 没有新的提交记录')
        return []
      }

      return this.parseGitLog(gitLog)
    } catch (error) {
      console.error('❌ 获取 Git 提交记录失败:', error)
      return []
    }
  }

  /**
   * 解析 Git 日志
   */
  private parseGitLog(gitLog: string): ChangeLogEntry[] {
    const commits: ChangeLogEntry[] = []
    const sections = gitLog.split('\n\n').filter((section) => section.trim())

    for (const section of sections) {
      const lines = section.split('\n').filter((line) => line.trim())
      if (lines.length === 0) continue

      const [commitLine, ...fileLines] = lines
      const [hash, date, author, message] = commitLine.split('|')

      if (!hash || !message) continue

      const entry = this.parseCommitMessage(message, {
        hash: hash.substring(0, 8),
        date,
        author,
        files: fileLines.filter((file) => file.trim() && !file.includes('|'))
      })

      if (entry) {
        commits.push(entry)
      }
    }

    return commits
  }

  /**
   * 解析提交信息
   */
  private parseCommitMessage(
    message: string,
    meta: { hash: string; date: string; author: string; files: string[] }
  ): ChangeLogEntry | null {
    // 匹配 Conventional Commits 格式
    const conventionalRegex = /^(feat|fix|docs|style|refactor|test|chore)(?:\(([^)]+)\))?: (.+)$/
    const match = message.match(conventionalRegex)

    if (!match) {
      // 如果不符合规范，尝试识别关键词
      const type = this.inferCommitType(message)
      return {
        type,
        description: message,
        ...meta
      }
    }

    const [, type, scope, description] = match

    return {
      type: type as ChangeLogEntry['type'],
      scope,
      description,
      ...meta
    }
  }

  /**
   * 推断提交类型
   */
  private inferCommitType(message: string): ChangeLogEntry['type'] {
    const lowerMessage = message.toLowerCase()

    if (
      lowerMessage.includes('add') ||
      lowerMessage.includes('新增') ||
      lowerMessage.includes('添加')
    ) {
      return 'feat'
    }
    if (
      lowerMessage.includes('fix') ||
      lowerMessage.includes('修复') ||
      lowerMessage.includes('解决')
    ) {
      return 'fix'
    }
    if (
      lowerMessage.includes('update') ||
      lowerMessage.includes('修改') ||
      lowerMessage.includes('更新')
    ) {
      return 'refactor'
    }
    if (
      lowerMessage.includes('remove') ||
      lowerMessage.includes('delete') ||
      lowerMessage.includes('删除')
    ) {
      return 'remove'
    }
    if (lowerMessage.includes('doc') || lowerMessage.includes('文档')) {
      return 'docs'
    }
    if (lowerMessage.includes('style') || lowerMessage.includes('样式')) {
      return 'style'
    }

    return 'chore'
  }

  /**
   * 格式化变更条目
   */
  private formatChangeEntry(entry: ChangeLogEntry): string {
    const typeEmoji = {
      feat: '✅',
      fix: '🔧',
      docs: '📝',
      style: '🎨',
      refactor: '🔄',
      test: '🧪',
      chore: '⚙️',
      remove: '❌'
    }

    const typeLabel = {
      feat: '新增功能',
      fix: '修复问题',
      docs: '文档更新',
      style: '样式调整',
      refactor: '代码重构',
      test: '测试相关',
      chore: '构建/工具',
      remove: '删除功能'
    }

    const emoji = typeEmoji[entry.type] || '📋'
    const label = typeLabel[entry.type] || '其他变更'
    const scope = entry.scope ? ` (${entry.scope})` : ''

    let formatted = `#### ${emoji} ${entry.date} - ${label}${scope}: ${entry.description}\n`
    formatted += `**提交哈希**: \`${entry.hash}\`  \n`
    formatted += `**提交者**: ${entry.author}  \n`

    if (entry.files.length > 0) {
      const viewFiles = entry.files.filter((file) => file.startsWith('src/views/'))
      if (viewFiles.length > 0) {
        formatted += `**影响文件**:  \n`
        viewFiles.forEach((file) => {
          formatted += `- \`${file}\`  \n`
        })
      }
    }

    formatted += '\n'
    return formatted
  }

  /**
   * 更新变更日志
   */
  private updateChangelog(entries: ChangeLogEntry[]): void {
    if (entries.length === 0) {
      console.log('✅ 没有需要更新的变更记录')
      return
    }

    try {
      let currentContent = ''
      if (existsSync(this.changelogPath)) {
        currentContent = readFileSync(this.changelogPath, 'utf-8')
      }

      // 找到变更历史部分
      const historyMarker = '## 📈 变更历史'
      const historyIndex = currentContent.indexOf(historyMarker)

      if (historyIndex === -1) {
        console.error('❌ 无法找到变更历史部分')
        return
      }

      // 找到下一个主要章节
      const nextSectionIndex = currentContent.indexOf('\n## ', historyIndex + historyMarker.length)
      const beforeHistory = currentContent.substring(0, historyIndex + historyMarker.length)
      const afterHistory = nextSectionIndex > -1 ? currentContent.substring(nextSectionIndex) : ''

      // 生成新的变更条目
      let newEntries = '\n\n'
      entries.reverse().forEach((entry) => {
        newEntries += this.formatChangeEntry(entry)
      })

      // 如果已有变更记录，保留它们
      let existingEntries = ''
      if (nextSectionIndex > -1) {
        existingEntries = currentContent.substring(
          historyIndex + historyMarker.length,
          nextSectionIndex
        )
      }

      const newContent = beforeHistory + newEntries + existingEntries + afterHistory

      // 更新统计信息
      const stats = this.calculateStats(entries)
      const updatedContent = this.updateStats(newContent, stats)

      writeFileSync(this.changelogPath, updatedContent)
      console.log(`✅ 成功更新变更日志，添加了 ${entries.length} 条记录`)

      // 保存最后处理的提交哈希
      if (entries.length > 0) {
        this.saveLastCommitHash(entries[0].hash)
      }
    } catch (error) {
      console.error('❌ 更新变更日志失败:', error)
    }
  }

  /**
   * 计算统计信息
   */
  private calculateStats(entries: ChangeLogEntry[]): Record<string, number> {
    const stats = {
      feat: 0,
      fix: 0,
      docs: 0,
      style: 0,
      refactor: 0,
      test: 0,
      chore: 0,
      remove: 0
    }

    entries.forEach((entry) => {
      if (stats.hasOwnProperty(entry.type)) {
        stats[entry.type]++
      }
    })

    return stats
  }

  /**
   * 更新统计信息
   */
  private updateStats(content: string, newStats: Record<string, number>): string {
    // 更新最后修改时间
    let updatedContent = content.replace(
      /\*\*最后更新\*\*: \d{4}年\d{1,2}月\d{1,2}日/,
      `**最后更新**: ${new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`
    )

    // 更新总提交数
    const totalCommits = Object.values(newStats).reduce((sum, count) => sum + count, 0)
    updatedContent = updatedContent.replace(
      /\*\*总提交数\*\*: \d+/,
      `**总提交数**: ${totalCommits}`
    )

    // 更新各类型统计
    const typeLabels = {
      feat: '功能新增',
      fix: '问题修复',
      docs: '文档更新',
      style: '样式调整',
      refactor: '代码重构',
      test: '测试相关',
      chore: '构建/工具',
      remove: '删除功能'
    }

    Object.entries(newStats).forEach(([type, count]) => {
      const label = typeLabels[type as keyof typeof typeLabels]
      if (label) {
        const regex = new RegExp(`\\*\\*${label}\\*\\*: \\d+`)
        updatedContent = updatedContent.replace(regex, `**${label}**: ${count}`)
      }
    })

    return updatedContent
  }

  /**
   * 运行更新器
   */
  public run(): void {
    console.log('📊 检查新的提交记录...')
    const newCommits = this.getNewCommits()

    if (newCommits.length > 0) {
      console.log(`📝 发现 ${newCommits.length} 个新提交`)
      this.updateChangelog(newCommits)
    } else {
      console.log('✅ 没有新的变更需要记录')
    }
  }
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new ChangeLogUpdater()
  updater.run()
}

export default ChangeLogUpdater
