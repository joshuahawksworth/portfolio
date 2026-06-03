import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? 'test', process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? '';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? '';

  return {
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
};
});
