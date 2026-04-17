import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@draftly/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@draftly/providers': path.resolve(__dirname, '../../packages/providers/src'),
      '@draftly/core': path.resolve(__dirname, '../../packages/core/src'),
      '@draftly/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
