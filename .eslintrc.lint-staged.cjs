module.exports = {
  extends: [
    './eslint.config.mjs'
  ],
  rules: {
    // 在 lint-staged 中放宽一些规则，避免提交时失败
    '@typescript-eslint/no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],
    'no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    // 允许 console.log 在开发阶段
    'no-console': 'off',
    // 允许 debugger 在开发阶段
    'no-debugger': 'warn',
    // 允许空函数
    '@typescript-eslint/no-empty-function': 'warn',
    // 允许 any 类型
    '@typescript-eslint/no-explicit-any': 'off',
    // 允许 require
    '@typescript-eslint/no-var-requires': 'off',
    // 允许非空断言
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // 允许空接口
    '@typescript-eslint/no-empty-interface': 'warn',
    // 允许重复声明
    'no-redeclare': 'warn',
    // 允许未定义的变量
    'no-undef': 'off',
    // 允许未使用的表达式
    'no-unused-expressions': 'warn',
    // Vue 相关规则
    'vue/no-unused-vars': 'warn',
    'vue/no-unused-components': 'warn',
    'vue/require-v-for-key': 'warn',
    'vue/no-mutating-props': 'warn',
    'vue/no-side-effects-in-computed-properties': 'warn',
    'vue/return-in-computed-property': 'warn',
    'vue/valid-template-root': 'warn',
    'vue/no-multiple-template-root': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-v-model-argument': 'warn',
    'vue/require-explicit-emits': 'warn',
    'vue/require-default-prop': 'warn',
    'vue/require-prop-types': 'warn',
    'vue/no-v-html': 'warn',
    'vue/require-key': 'warn',
    'vue/no-use-v-if-with-v-for': 'warn',
    'vue/no-duplicate-attributes': 'warn',
    'vue/no-duplicate-keys': 'warn',
    'vue/no-template-key': 'warn',
    'vue/no-textarea-mustache': 'warn',
    'vue/no-unused-refs': 'warn',
    'vue/no-useless-v-bind': 'warn',
    'vue/no-useless-concat': 'warn',
    'vue/no-useless-mustaches': 'warn',
    'vue/no-useless-v-on': 'warn',
    'vue/prefer-import-from-vue': 'warn',
    'vue/prefer-separate-static-class': 'warn',
    'vue/prefer-true-attribute-shorthand': 'warn',
    'vue/require-toggle-inside-transition': 'warn',
    'vue/valid-v-bind-sync': 'warn',
    'vue/valid-v-for': 'warn',
    'vue/valid-v-if': 'warn',
    'vue/valid-v-model': 'warn',
    'vue/valid-v-on': 'warn',
    'vue/valid-v-show': 'warn',
    'vue/valid-v-slot': 'warn'
  }
}
