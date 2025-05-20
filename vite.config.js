import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.mp3', '**/*.wav'], // ✅ 오디오 포함 명시
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});