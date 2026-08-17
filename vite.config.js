import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: process.env.SSL_KEY_FILE && process.env.SSL_CERT_FILE
      ? {
          key: fs.readFileSync(process.env.SSL_KEY_FILE),
          cert: fs.readFileSync(process.env.SSL_CERT_FILE),
        }
      : false,
  },
});
