// ESLint v8 config (legacy format) — works with eslint-config-expo for SDK 51.
module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'react-hooks'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'web-build/',
    'babel.config.js',
    'metro.config.js',
    '*.config.js',
  ],
  overrides: [
    {
      files: ['jest.setup.js', '**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**'],
      env: { jest: true, node: true },
    },
  ],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    // The 'refs' rule is part of eslint-plugin-react-hooks v7's React Compiler
    // ruleset. It's a false-positive against React 18's `useRef().current` pattern,
    // which is fine. Re-enable when migrating to React 19 + Compiler.
    'react-hooks/refs': 'off',
    'react-hooks/set-state-in-effect': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-empty-function': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
