import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const dir = import.meta.dirname;

// Portada (/) + deck Día 1 (/genui/) + deck Día 2 (/agentes/) + consola (/presenter/) + app de asistentes (/live/)
export default defineConfig({
  server: {
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**'],
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        home: resolve(dir, 'index.html'),
        genui: resolve(dir, 'genui/index.html'),
        agentes: resolve(dir, 'agentes/index.html'),
        presenter: resolve(dir, 'presenter/index.html'),
        live: resolve(dir, 'live/index.html'),
      },
    },
  },
});
