import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage'],
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // One connection pool per process: only shared/database creates the client.
    files: ['src/**/*.ts'],
    ignores: ['src/shared/database/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        paths: [{
          name: '@prisma/client',
          importNames: ['PrismaClient'],
          allowTypeImports: true,
          message: 'Use prismaClient from shared/database; a new PrismaClient opens another connection pool.',
        }],
      }],
    },
  },
  {
    // Data access belongs in repositories. Warn for now: step 5 of the delivery plan
    // replaces this client with the tenant-scoped one and turns this into an error.
    files: ['src/**/*.ts'],
    ignores: ['src/shared/database/**', 'src/**/repositories/**', 'src/tests/**'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [{
          regex: 'shared/database/prismaClient$',
          message: 'Access the database through a repository.',
        }],
      }],
    },
  },
);
