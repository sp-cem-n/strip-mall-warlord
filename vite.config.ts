import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// GitHub Pages serves project sites from /<repo>/. Set BASE_PATH=/strip-mall-warlord/
// (the deploy workflow does) or pass --base. Defaults to relative paths so dist/ works anywhere.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [preact()],
  build: { outDir: 'dist', target: 'es2022' },
});
