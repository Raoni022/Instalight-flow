import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // 'hidden': gera os .map mas não os referencia no bundle (disponíveis para monitoramento
    // interno mas não expostos via browser DevTools em produção).
    sourcemap: 'hidden',
  },
  server: {
    // Em desenvolvimento, o Vite faz proxy das chamadas /api para o servidor local.
    // Em produção (Vercel), /api/claude é tratado como Serverless Function.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
