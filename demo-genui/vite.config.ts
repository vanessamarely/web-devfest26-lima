import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const dir = import.meta.dirname;

// Nido (/) + comparación lado a lado (/compare.html)
export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: { input: { main: resolve(dir, 'index.html'), compare: resolve(dir, 'compare.html') } },
  },
  worker: { format: 'es' },
});
