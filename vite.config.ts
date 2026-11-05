import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/fckn-workout/',
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // The rule tests build every routine for every combination of answers.
    testTimeout: 120_000,
  },
});
