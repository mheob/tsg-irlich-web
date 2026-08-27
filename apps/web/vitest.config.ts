import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

const ASSET_PATTERN = /\.(?:avif|gif|jpe?g|png|svg|webp)$/u;

/**
 * Resolves static image imports to the object Next.js injects for them, so modules that import
 * an image (for example `src/utils/groups.ts`) can be loaded in a test run.
 *
 * @returns The Vite plugin that stubs static image imports.
 */
function assetStub(): Plugin {
	return {
		enforce: 'pre',
		load(id) {
			if (!ASSET_PATTERN.test(id)) {
				return null;
			}
			return `export default { blurDataURL: '', blurWidth: 0, height: 1, src: '${id}', width: 1 };`;
		},
		name: 'tsgi:asset-stub',
		resolveId(source) {
			return ASSET_PATTERN.test(source) ? source : null;
		},
	};
}

export default defineConfig({
	plugins: [assetStub()],
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
