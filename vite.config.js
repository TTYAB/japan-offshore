import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // dataフォルダを直接公開ディレクトリとして使う
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
