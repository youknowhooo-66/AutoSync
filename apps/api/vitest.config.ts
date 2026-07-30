import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    globalSetup: './tests/globalSetup.ts',
    setupFiles: './tests/setup.ts',
    hookTimeout: 30000,
    testTimeout: 30000,
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'prisma/**',
        '**/*.d.ts',
        'src/server.ts',
        'src/shared/infra/http/swagger.ts',
      ],
    },
  },
});
