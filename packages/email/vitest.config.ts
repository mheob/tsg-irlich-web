import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	test: {
		coverage: {
			exclude: ['**/*.test.{ts,tsx}', '**/test-utils/**', '**/*.config.ts', '**/*.generated.ts'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
		},
		environment: 'node',
		exclude: ['.react-email/**', 'node_modules/**'],
		include: ['{components,emails,lib,scripts}/**/*.test.{ts,tsx}'],
		name: 'email',
	},
});
