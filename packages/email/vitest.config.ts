import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	test: {
		coverage: {
			reporter: ['text', 'html', 'lcov'],
		},
		environment: 'node',
		exclude: ['.react-email/**', 'node_modules/**'],
		include: ['{components,emails,lib,scripts}/**/*.test.{ts,tsx}'],
		name: 'email',
	},
});
