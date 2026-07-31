import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // This repository is intended to be published as
  // https://widaddabbas.github.io/nback/
  base: '/nback/',
  test: {
    environment: 'node',
    globals: true,
  },
});
