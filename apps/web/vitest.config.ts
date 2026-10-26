import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		coverage: {
			exclude: ['**/*.test.{ts,tsx}', '**/test-utils/**', '**/*.config.ts', '**/*.generated.ts'],
			// Vitest 4 replaced `coverage.all` with this: without it only files a test happens to
			// import are scored, so an untested file drops out of the denominator instead of
			// counting as uncovered.
			include: ['src/**/*.{ts,tsx}'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			// A ratchet, not a target: the numbers sit a few points below what the suite reaches, so
			// a regression fails the run while normal work does not. Raise them, never lower them.
			// The remaining gap is a long tail of single branches plus a handful of spots the test
			// harness cannot reach at all (see `AGENTS.md`).
			thresholds: { branches: 88, functions: 91, lines: 94, statements: 94 },
		},
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					exclude: ['src/{components,hooks}/**', 'node_modules/**'],
					include: ['src/**/*.test.ts'],
					name: { color: 'green', label: 'node' },
				},
			},
			{
				extends: true,
				plugins: [react()],
				test: {
					environment: 'jsdom',
					include: ['src/**/*.test.tsx', 'src/{components,hooks}/**/*.test.ts'],
					name: { color: 'magenta', label: 'dom' },
					setupFiles: ['./test-utils/setup-dom.ts'],
				},
			},
		],
	},
});
