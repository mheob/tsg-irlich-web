import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		coverage: {
			exclude: [
				'**/*.test.{ts,tsx}',
				'**/test-utils/**',
				'**/*.config.ts',
				'**/*.generated.ts',
				// Barrels only re-export; they carry no logic to cover and importing one in a test
				// would raise the number without testing anything.
				'**/index.ts',
			],
			// Vitest 4 replaced `coverage.all` with this: without it only files a test happens to
			// import are scored, so an untested file drops out of the denominator instead of
			// counting as uncovered.
			include: ['src/**/*.{ts,tsx}'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			// This workspace is fully covered and stays that way: anything new either comes with a
			// test or is excluded above for having no coverable statements.
			thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
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
