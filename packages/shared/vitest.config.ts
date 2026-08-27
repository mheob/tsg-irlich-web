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
