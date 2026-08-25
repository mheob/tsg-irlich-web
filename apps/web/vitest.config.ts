import tsconfigPaths from 'vite-tsconfig-paths';
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
	plugins: [assetStub(), tsconfigPaths()],
	test: {
		coverage: {
			reporter: ['text', 'html', 'lcov'],
		},
		projects: [
			{
				extends: true,
				test: {
					environment: 'node',
					exclude: ['src/components/**', 'src/hooks/**', 'node_modules/**'],
					include: ['src/**/*.test.{ts,tsx}'],
					name: { color: 'green', label: 'node' },
				},
			},
		],
	},
});
