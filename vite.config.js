import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// ビルド時にdata/フォルダをdist/data/にコピーするプラグイン
function copyDataFolder() {
  return {
    name: 'copy-data-folder',
    closeBundle() {
      const distDataDir = resolve(__dirname, 'dist/data');
      if (!existsSync(distDataDir)) {
        mkdirSync(distDataDir, { recursive: true });
      }
      copyFileSync(
        resolve(__dirname, 'data/boats-master.json'),
        resolve(distDataDir, 'boats-master.json')
      );
      copyFileSync(
        resolve(__dirname, 'data/catches.json'),
        resolve(distDataDir, 'catches.json')
      );
      console.log('✓ Copied data/ to dist/data/');
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDataFolder()],
});
