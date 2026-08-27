import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	resolve: { tsconfigPaths: true },
	test: {
		coverage: {
			exclude: ['**/*.test.{ts,tsx}', '**/test-utils/**', '**/*.config.ts', '**/*.generated.ts'],
			// Vitest 4 replaced `coverage.all` with this: without it only files a test happens to
			// import are scored, so an untested file drops out of the denominator instead of
			// counting as uncovered. `index.ts` files stay in: in this workspace they define
			// schemas and the desk structure rather than only re-exporting.
			include: ['{lib,plugins,schemas,structure,utils}/**/*.{ts,tsx}'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			// A floor at the level the suite currently reaches, to keep it from slipping while the
			// schemas are still largely untested. Raise it with every batch of new tests.
			thresholds: { branches: 60, functions: 20, lines: 23, statements: 23 },
		},
		environment: 'jsdom',
		exclude: ['dist/**', 'node_modules/**', '.sanity/**'],
		include: ['**/*.test.{ts,tsx}'],
		name: 'studio',
	},
});
