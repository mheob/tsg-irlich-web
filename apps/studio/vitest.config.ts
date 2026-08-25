import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		coverage: {
			reporter: ['text', 'html', 'lcov'],
		},
		environment: 'jsdom',
		exclude: ['dist/**', 'node_modules/**', '.sanity/**'],
		include: ['**/*.test.{ts,tsx}'],
		name: 'studio',
	},
});
