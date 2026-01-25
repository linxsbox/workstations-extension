import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// 读取根目录 package.json
const packageJsonPath = join(rootDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

// 定义需要同步版本号的文件列表
const filesToSync = [
  {
    path: join(rootDir, "packages", "app", "package.json"),
    name: "packages/app/package.json",
  },
  {
    path: join(rootDir, "packages", "extension", "package.json"),
    name: "packages/extension/package.json",
  },
  {
    path: join(rootDir, "packages", "extension", "manifest.json"),
    name: "packages/extension/src/manifest.json",
  },
  {
    path: join(rootDir, "public", "manifest.json"),
    name: "public/manifest.json",
    optional: true,
  },
];

let hasUpdates = false;
const updates = [];

// 遍历每个文件并更新版本号
for (const file of filesToSync) {
  try {
    if (!existsSync(file.path)) {
      if (file.optional) {
        continue;
      }
      console.warn(`⚠️  文件不存在: ${file.name}`);
      continue;
    }

    const content = JSON.parse(readFileSync(file.path, "utf-8"));
    const oldVersion = content.version;

    if (oldVersion !== version) {
      content.version = version;
      writeFileSync(
        file.path,
        JSON.stringify(content, null, 2) + "\n",
        "utf-8"
      );
      hasUpdates = true;
      updates.push(`   ${file.name}: ${oldVersion} → ${version}`);
    } else {
      updates.push(`   ${file.name}: ${version} (已是最新)`);
    }
  } catch (error) {
    console.error(`❌ 处理 ${file.name} 失败:`, error.message);
    process.exit(1);
  }
}

// 输出结果
if (hasUpdates) {
  console.log(`✅ 版本号已同步: ${version}`);
  updates.forEach((update) => console.log(update));
} else {
  console.log(`✅ 版本号已是最新: ${version}`);
  updates.forEach((update) => console.log(update));
}
