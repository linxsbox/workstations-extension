import { watch } from 'chokidar';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const extensionDist = join(rootDir, 'packages', 'extension', 'dist');
const appDist = join(rootDir, 'packages', 'app', 'dist');

let mergeTimeout;

/**
 * 执行合并脚本
 */
function executeMerge() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [join(__dirname, 'merge-dist.js')], {
      stdio: 'inherit',
      cwd: rootDir
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`合并脚本退出码: ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * 防抖合并
 */
function debouncedMerge() {
  clearTimeout(mergeTimeout);
  mergeTimeout = setTimeout(async () => {
    try {
      await executeMerge();
    } catch (error) {
      console.error('❌ 合并失败:', error.message);
    }
  }, 500); // 500ms 防抖延迟
}

console.log('[Watch] 开始监听文件变化...');
console.log(`[Watch] 监听目录: ${extensionDist}`);
console.log(`[Watch] 监听目录: ${appDist}`);

// 启动时如果 dist 存在，先做一次合并
if (existsSync(extensionDist) && existsSync(appDist)) {
  console.log('[Watch] 执行初始合并...');
  executeMerge().catch((error) => {
    console.error('❌ 初始合并失败:', error.message);
  });
}

// 监听两个 dist 目录（如果不存在会自动创建监听）
const watcher = watch([extensionDist, appDist], {
  ignored: /(^|[\/\\])\.|node_modules/,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100
  },
  ignoreInitial: true // 忽略初始扫描
});

watcher
  .on('add', (path) => {
    console.log(`[Watch] 文件添加: ${path}`);
    debouncedMerge();
  })
  .on('change', (path) => {
    console.log(`[Watch] 文件修改: ${path}`);
    debouncedMerge();
  })
  .on('unlink', (path) => {
    console.log(`[Watch] 文件删除: ${path}`);
    debouncedMerge();
  })
  .on('error', (error) => {
    console.error('[Watch] 监听错误:', error);
  });

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[Watch] 停止监听');
  watcher.close();
  process.exit(0);
});


