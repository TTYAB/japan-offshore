import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ビルド時に data/*.json をすべて dist/data/ にコピーするプラグイン
function copyDataFolder() {
  return {
    name: 'copy-data-folder',
    closeBundle() {
      const srcDir = resolve(__dirname, 'data');
      const distDataDir = resolve(__dirname, 'dist/data');
      if (!existsSync(distDataDir)) {
        mkdirSync(distDataDir, { recursive: true });
      }
      if (!existsSync(srcDir)) {
        console.warn('⚠ data/ directory not found, skipping');
        return;
      }
      const files = readdirSync(srcDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        copyFileSync(
          resolve(srcDir, file),
          resolve(distDataDir, file)
        );
      }
      console.log(`✓ Copied ${files.length} JSON file(s) to dist/data/: ${files.join(', ')}`);
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDataFolder()],
});
