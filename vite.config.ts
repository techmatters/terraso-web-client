import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
    },
    plugins: [react()],
    envPrefix: 'REACT_APP_',
    resolve: {
      alias: {
        'terraso-web-client': '/src',
      },
    },
    server: {
      port: 3000,
    },
  };
});
