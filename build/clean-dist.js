import { rmSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const dirsToClean = [
  join(rootDir, 'dist'),
  join(rootDir, 'packages', 'app', 'dist'),
  join(rootDir, 'packages', 'extension', 'dist'),
];

console.log('🧹 开始清理 dist 目录...');

for (const dir of dirsToClean) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`✅ 已清理: ${dir}`);
  }
}

console.log('✅ 清理完成');
