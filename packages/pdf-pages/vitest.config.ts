import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		coverage: {
			exclude: ['**/*.test.ts', '**/test-utils/**', '**/*.config.ts', '**/index.ts'],
			// Vitest 4 replaced `coverage.all` with this: without it only files a test happens to
			// import are scored, so an untested file drops out of the denominator.
			include: ['src/**/*.ts'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			// Fully covered and it stays that way, like `packages/shared` and `packages/email`.
			thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
		},
		environment: 'node',
		include: ['src/**/*.test.ts'],
	},
});
