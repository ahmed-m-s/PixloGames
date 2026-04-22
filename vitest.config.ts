import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/embed-security.ts',
        'lib/game-ingestion.ts',
        'lib/games.ts',
        'lib/server-validation.ts'
      ],
      thresholds: {
        branches: 60,
        functions: 70,
        lines: 75,
        statements: 75
      }
    }
  }
});
