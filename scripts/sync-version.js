import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取 package.json
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// 读取 manifest.json
const manifestPath = join(rootDir, 'public', 'manifest.json');
const manifestJson = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// 更新 manifest.json 的版本号
if (manifestJson.version !== version) {
  manifestJson.version = version;
  writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n', 'utf-8');
  console.log(`✅ 版本号已同步: ${version}`);
  console.log(`   package.json: ${version}`);
  console.log(`   manifest.json: ${version}`);
} else {
  console.log(`✅ 版本号已是最新: ${version}`);
}
