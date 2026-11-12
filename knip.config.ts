import type { KnipConfig } from 'knip';

/**
 * Knip reports unused files, exports, dependencies and catalog entries across every workspace. Its
 * plugins find the entry points of Next.js, Sanity, Vitest, Playwright, React Email, Lefthook and
 * the GitHub workflows on their own; the entries below are the ones no plugin can see.
 */
const config: KnipConfig = {
	// A type that shapes an exported function's parameters or result is part of that function's API,
	// even when no other module names it. Values used only in their own file stay reported.
	ignoreExportsUsedInFile: { interface: true, type: true },
	ignoreIssues: {
		// Sanity TypeGen writes a type for every schema type and query, whether the app reads it or not
		'apps/web/src/types/sanity.types.generated.ts': ['types'],
	},
	workspaces: {
		'.': {
			// `vp migrate` pins the Vite+ toolchain in the root manifest and re-adds them on every run
			ignoreDependencies: ['@vitest/coverage-v8', 'vitest'],
		},
		'apps/studio': {
			// Run through `sanity exec` (`import:echo`, `ocr:echo`, the e2e form and the partner page by
			// hand), which Knip's script parser skips
			entry: [
				'scripts/create-e2e-form.ts',
				'scripts/create-partner-page.ts',
				'scripts/import-echo.ts',
				'scripts/ocr-echo.ts',
			],
		},
		'apps/web': {
			entry: [
				// Loaded with `--import` from `NODE_OPTIONS` of the Playwright web server
				'e2e/mocks/preload.ts',
				// Swapped in for BotID by `turbopack.resolveAlias` in the e2e build (`next.config.ts`)
				'e2e/mocks/botid-client.ts',
				'e2e/mocks/botid-server.ts',
				// Lighthouse CI `require()`s it in `lhci autorun`, and Knip has no Lighthouse plugin
				'lighthouserc.cjs',
			],
		},
	},
};

export default config;
