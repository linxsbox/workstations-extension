import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import copy from "rollup-plugin-copy";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevMode = mode === "development";

  const terserOptions = isDevMode
    ? undefined
    : {
        compress: {
          drop_console: !isDevMode,
          drop_debugger: !isDevMode,
        },
        format: {
          comments: false, // 移除注释
        },
      };

  return {
    build: {
      // 开发模式下不压缩代码，加快构建速度
      minify: isDevMode ? false : "terser",
      // 开发模式下生成源码映射
      sourcemap: isDevMode ? "inline" : false,
      outDir: "dist",
      // 开发模式下不清空输出目录
      emptyOutDir: !isDevMode,
      terserOptions: terserOptions,
      rollupOptions: {
        output: {
          manualChunks: {
            // 分离第三方库
            vendor: ["vue", "pinia", "naive-ui"],
          },
        },
      },
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
        dts: "types/auto-imports.d.ts",
      }),
      copy({
        verbose: true,
        copyOnce: !isDevMode,
        hook: "closeBundle",
        targets: [
          {
            src: "src/background/service-worker.js",
            dest: "dist/background",
          },
          { src: "src/content/handler.js", dest: "dist/content" },
        ],
      }),
      // 仅在生产构建时添加分析器
      !isDevMode &&
        visualizer({
          open: true, // 构建完成后自动打开分析报告
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        assets: fileURLToPath(new URL("./src/assets", import.meta.url)),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
    },
  };
});
