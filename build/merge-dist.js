import { cpSync, rmSync, existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const extensionDist = join(rootDir, 'packages', 'extension', 'dist');
const appDist = join(rootDir, 'packages', 'app', 'dist');
const targetDist = join(rootDir, 'dist');

/**
 * 递归复制目录，跳过指定的目录
 */
function copyDirRecursive(src, dest, skipDirs = []) {
  if (!existsSync(dest)) {
    cpSync(src, dest, { recursive: true });
    return;
  }

  const files = readdirSync(src);
  for (const file of files) {
    // 跳过指定的目录
    if (skipDirs.includes(file)) {
      continue;
    }

    const srcPath = join(src, file);
    const destPath = join(dest, file);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath, skipDirs);
    } else {
      cpSync(srcPath, destPath, { force: true });
    }
  }
}

try {
  // 检查源目录是否存在
  if (!existsSync(extensionDist)) {
    console.error(`❌ 扩展 dist 目录不存在: ${extensionDist}`);
    process.exit(1);
  }

  console.log(`🔄 开始合并 dist...`);

  // 创建目标目录（如果不存在）
  if (!existsSync(targetDist)) {
    cpSync(extensionDist, targetDist, { recursive: true });
    console.log(`✅ 创建 dist 目录并复制 packages/extension/dist`);
  } else {
    // 目标目录存在，只更新 extension 的内容
    copyDirRecursive(extensionDist, targetDist);
    console.log(`✅ 更新 packages/extension/dist → dist`);
  }

  // 合并 app dist（如果存在）
  if (existsSync(appDist)) {
    // 跳过 popup 目录，因为 extension 已有
    // 也跳过 icons 和 _locales，因为这些应该来自 extension
    copyDirRecursive(appDist, targetDist, ['popup', 'icons', '_locales']);
    console.log(`✅ 合并 packages/app/dist → dist (跳过 popup、icons、_locales)`);
  } else {
    console.warn(`⚠️  应用 dist 目录不存在: ${appDist}`);
  }

  console.log(`✅ dist 合并完成`);
} catch (error) {
  console.error(`❌ 合并失败:`, error.message);
  process.exit(1);
}

