import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    globals: false,
    restoreMocks: true,
    maxWorkers: 2,
    reporters: ['default', 'junit'],
    outputFile: { junit: 'docs/quality/vitest-results.xml' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
      reportsDirectory: 'reports/coverage',
      reporter: ['text-summary', 'json-summary', 'json', 'html'],
      thresholds: {
        '**order-store.ts': { branches: 80 },
        '**cart-store.ts': { branches: 80 },
        '**catalog-store.ts': { branches: 80 },
        '**account-store.ts': { branches: 80 },
      },
    },
    projects: [
      { extends: true, test: { name: 'unit', include: ['tests/unit/**/*.test.ts'] } },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: ['tests/support/setup-state.ts'],
        },
      },
    ],
  },
})
