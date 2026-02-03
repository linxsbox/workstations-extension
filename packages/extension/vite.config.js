import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevMode = mode === 'development';

  const terserOptions = isDevMode
    ? undefined
    : {
        compress: {
          drop_console: !isDevMode,
          drop_debugger: !isDevMode,
        },
        format: {
          comments: false,
        },
      };

  return {
    build: {
      minify: isDevMode ? false : 'terser',
      sourcemap: isDevMode ? 'inline' : false,
      outDir: 'dist',
      emptyOutDir: !isDevMode,
      terserOptions: terserOptions,
      rollupOptions: {
        input: {
          service_worker: fileURLToPath(
            new URL('./src/background/service_worker.js', import.meta.url)
          ),
          shared_worker: fileURLToPath(
            new URL('./src/shared/shared_worker.js', import.meta.url)
          ),
          service_offscreen: fileURLToPath(
            new URL('./src/offscreen/service_offscreen.html', import.meta.url)
          ),
          popup: fileURLToPath(
            new URL('./src/popup/index.html', import.meta.url)
          ),
        },
        output: {
          dir: 'dist',
          entryFileNames: (chunkInfo) => {
            // service_worker 输出到 background 目录
            if (chunkInfo.name === 'service_worker') {
              return 'background/service_worker.js';
            }
            // shared_worker 输出到 background/shared 目录
            if (chunkInfo.name === 'shared_worker') {
              return 'background/shared/shared_worker.js';
            }
            // service_offscreen 输出到 background 目录
            if (chunkInfo.name === 'service_offscreen') {
              return 'background/offscreen/service_offscreen.js';
            }
            // popup 输出到 popup 目录
            if (chunkInfo.name === 'popup') {
              return 'popup/popup.js';
            }
            return '[name]/[name].js';
          },
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    optimizeDeps: {
      include: ['@linxs/toolkit'],
    },
    plugins: [
      copy({
        verbose: true,
        copyOnce: !isDevMode,
        hook: 'closeBundle',
        targets: [
          { src: 'manifest.json', dest: 'dist' },
          { src: 'assets/icons', dest: 'dist' },
          { src: 'assets/_locales', dest: 'dist' },
          { src: 'src/popup/index.html', dest: 'dist/popup' },
          {
            src: 'src/modules/peerjs.min.js',
            dest: 'dist/background/offscreen',
          },
          {
            src: 'src/offscreen/service_offscreen.html',
            dest: 'dist/background/offscreen',
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
