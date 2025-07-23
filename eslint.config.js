import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },   // 👈 KEY: allow JSX parsing
      },
      globals: {
        React: 'readonly', // Next injects React types as needed; safe to keep
        JSX: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        Response: 'readonly',
        setTimeout: 'readonly',
        setImmediate: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        URLSearchParams: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react/no-unescaped-entities': 'off',          // harmless to leave; ignored if no react plugin
      '@next/next/no-page-custom-font': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
    },
  },
];
