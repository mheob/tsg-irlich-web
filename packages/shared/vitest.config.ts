import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		coverage: {
			exclude: ['**/*.test.{ts,tsx}', '**/test-utils/**', '**/*.config.ts', '**/*.generated.ts'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
		},
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					include: ['src/**/*.test.ts'],
					name: { color: 'green', label: 'node' },
				},
			},
			{
				extends: true,
				plugins: [react()],
				test: {
					environment: 'jsdom',
					include: ['src/**/*.test.tsx'],
					name: { color: 'magenta', label: 'dom' },
				},
			},
		],
	},
});
