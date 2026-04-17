import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/src/**/*.test.ts', 'apps/**/src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@draftly/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@draftly/providers': path.resolve(__dirname, 'packages/providers/src'),
      '@draftly/core': path.resolve(__dirname, 'packages/core/src'),
      '@draftly/ui': path.resolve(__dirname, 'packages/ui/src'),
    },
  },
});
