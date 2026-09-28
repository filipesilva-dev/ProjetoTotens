import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY ?? 'http://localhost:8000';
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    build: { target: 'es2022', outDir: 'dist', sourcemap: mode !== 'production' },
    server: {
      port: 5173, host: true,
      proxy: { '/api': { target: apiTarget, changeOrigin: true, secure: false } },
    },
  };
});
