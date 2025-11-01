declare module 'markdown-it' {
  import MarkdownIt from 'markdown-it'
  const MarkdownItConstructor: new (options?: any) => MarkdownIt
  export = MarkdownItConstructor
}
