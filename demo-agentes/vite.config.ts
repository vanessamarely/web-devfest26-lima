import { defineConfig } from 'vite';

// Mesa: una sola página. Worker no hace falta.
export default defineConfig({ build: { target: 'es2022' } });
