import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Owlbear Rodeo must be able to fetch manifest.json and assets from the dev server.
    cors: {
      origin: 'https://www.owlbear.rodeo',
      methods: ['GET', 'POST', 'OPTIONS'],
    },
  },
  build: {
    rollupOptions: {
      // Two entry points: the UI (popover / standalone editor) and the OBR background page.
      input: {
        main: 'index.html',
        background: 'background.html',
      },
    },
  },
});
