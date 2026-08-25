import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		coverage: {
			reporter: ['text', 'html', 'lcov'],
		},
		environment: 'node',
		include: ['src/**/*.test.{ts,tsx}'],
		name: 'shared',
	},
});
