import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Served under apps.fkngo.net/fckn-workout/; override for local or other hosts.
const base = process.env.APP_BASE_PATH || '/fckn-workout/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // The rule tests build every routine for every combination of answers.
    testTimeout: 120_000,
  },
});
