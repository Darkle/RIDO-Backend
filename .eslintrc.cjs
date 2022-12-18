module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    emitDecoratorMetadata: true,
  },
  globals: {},
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  extends: ['eslint:recommended', 'plugin:import/errors'],
  ignorePatterns: ['**/node_modules/**'],
  overrides: [
    // This is for test files
    {
      files: ['**/*.ts', '**/*.d.ts', './*.d.ts', './*.ts'],
      extends: ['./.eslintrc-ts-base.cjs'],
      rules: {
        '@typescript-eslint/no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'functional/immutable-data': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/indent': 'off',
        complexity: 'off',
        'no-param-reassign': 'off',
      },
    },
    {
      files: ['services/api/dbschema/*.*'],
      extends: ['./.eslintrc-ts-base.cjs'],
      rules: {
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        'functional/prefer-readonly-type': 'off',
        '@typescript-eslint/quotes': 'off',
        quotes: 'off',
      },
    },
    // Everything other than test files
    {
      files: ['**/*.ts', '**/*.d.ts', './*.d.ts', './*.ts'],
      excludedFiles: ['test/**', 'services/api/dbschema/interfaces.ts'],
      extends: ['./.eslintrc-ts-base.cjs'],
    },
  ],
  rules: {
    'import/prefer-default-export': 'off',
    'array-callback-return': 'error',
    camelcase: 'off',
    'capitalized-comments': ['off'],
    complexity: ['error', 4],
    'consistent-return': 'error',
    'comma-dangle': 'off',
    'dot-notation': 'off',
    'eol-last': 'off',
    eqeqeq: 'error',
    'function-paren-newline': 'off',
    'generator-star-spacing': 'off',
    'guard-for-in': 'error',
    'global-require': 'off',
    'implicit-arrow-linebreak': 'off',
    indent: 'off',
    'max-depth': ['error', 3],
    'max-lines-per-function': ['error', { max: 24, skipComments: true }],
    'max-len': 'off',
    'max-params': ['error', 4],
    'max-statements-per-line': ['error', { max: 1 }],
    'new-cap': 'off',
    'newline-per-chained-call': 'off',
    'no-await-in-loop': 'error',
    'no-console': 'off',
    'no-confusing-arrow': 'off',
    'no-duplicate-imports': 'off',
    'no-debugger': 'warn',
    'no-else-return': 'error',
    'no-eq-null': 'error',
    'no-magic-numbers': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['store', 'res'],
      },
    ],
    'no-plusplus': 'error',
    'no-return-await': 'error',
    'no-return-assign': ['error', 'except-parens'],
    'no-shadow': 'off',
    'no-undef-init': 'error',
    'no-unneeded-ternary': ['error', { defaultAssignment: true }],
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-useless-constructor': 'off',
    'no-unused-expressions': 'off',
    'no-useless-return': 'error',
    'object-curly-spacing': 'off',
    'object-curly-newline': 'off',
    'operator-assignment': ['error', 'never'],
    'operator-linebreak': 'off',
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    radix: 'error',
    'require-atomic-updates': 'error',
    'require-unicode-regexp': 'error',
    'require-await': 'off',
    semi: 'off',
    'spaced-comment': 'off',
    'space-infix-ops': 'off',
  },
}
