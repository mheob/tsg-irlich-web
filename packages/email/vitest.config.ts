import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	test: {
		coverage: {
			exclude: [
				'**/*.test.{ts,tsx}',
				'**/test-utils/**',
				'**/*.config.ts',
				'**/*.generated.ts',
				// Build script: top-level await that writes the rendered template to `dist/`.
				// Covering it would mean running the write for its own sake.
				'scripts/**',
				// No executable statements to cover: `emails/index.ts` only re-exports and
				// `newsletter-event.ts` only declares an interface. V8 scores both 0% of 0.
				'**/index.ts',
				'components/newsletter/newsletter-event.ts',
			],
			// Vitest 4 replaced `coverage.all` with this: without it only files a test happens to
			// import are scored, so an untested file drops out of the denominator instead of
			// counting as uncovered.
			include: ['{components,emails,lib}/**/*.{ts,tsx}'],
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			reportsDirectory: './coverage',
			// This workspace is fully covered and stays that way: anything new either comes with a
			// test or is excluded above for having no coverable statements.
			thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
		},
		environment: 'node',
		exclude: ['.react-email/**', 'node_modules/**'],
		include: ['{components,emails,lib,scripts}/**/*.test.{ts,tsx}'],
		name: 'email',
	},
});
