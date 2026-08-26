import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		coverage: {
			exclude: ['**/*.test.{ts,tsx}', '**/test-utils/**', '**/*.config.ts', '**/*.generated.ts'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
		},
		environment: 'jsdom',
		exclude: ['dist/**', 'node_modules/**', '.sanity/**'],
		include: ['**/*.test.{ts,tsx}'],
		name: 'studio',
	},
});
