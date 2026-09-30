import path from 'node:path';

import { baseConfig as fmtBaseConfig } from '@mheob/oxfmt-config';
import { baseConfig, reactConfig, tailwindcssConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'vite-plus';
import type { DummyRule, OxlintOverride } from 'vite-plus/lint';

/**
 * Lints a package's Tailwind classes against its own stylesheet. Vite+ reads only this root lint
 * config, and an override cannot carry `settings`, so the entry point travels in every rule's
 * options instead of `settings['better-tailwindcss']`.
 *
 * @param files - The globs the override applies to, relative to this file.
 * @param entryPoint - The package stylesheet, relative to this file so it resolves from any cwd.
 * @param rules - Package-specific adjustments to the shared Tailwind rule set.
 * @returns The override that enables the Tailwind rules for the package.
 */
function tailwindcssOverride(
	files: string[],
	entryPoint: string,
	rules: Record<string, DummyRule>,
): OxlintOverride {
	const preset = tailwindcssConfig();
	const options = { entryPoint: path.join(import.meta.dirname, entryPoint) };
	const withEntryPoint = (entry: DummyRule): DummyRule => {
		const [severity, ruleOptions, ...rest] = Array.isArray(entry) ? entry : [entry];
		const merged =
			typeof ruleOptions === 'object' && ruleOptions !== null
				? { ...ruleOptions, ...options }
				: options;
		return [severity, merged, ...rest];
	};

	return {
		files,
		jsPlugins: preset.jsPlugins,
		rules: Object.fromEntries(
			Object.entries({ ...preset.rules, ...rules })
				.filter((pair): pair is [string, DummyRule] => pair[1] !== undefined)
				.map(([name, entry]) => [name, withEntryPoint(entry)]),
		),
	};
}

export default defineConfig({
	fmt: {
		...fmtBaseConfig,
		arrowParens: 'always',
		ignorePatterns: ['**/*.generated.ts', '**/*generated*.ts'],
		sortImports: {
			customGroups: [
				{
					elementNamePattern: ['@tsgi-web/**'],
					groupName: 'tsgi',
				},
			],
			groups: [
				'type-import',
				'value-builtin',
				['type-external', 'value-external'],
				'tsgi',
				['type-internal', 'value-internal'],
				[
					'type-parent',
					'value-parent',
					'type-sibling',
					'value-sibling',
					'type-index',
					'value-index',
				],
				'style',
				'unknown',
			],
		},
		sortTailwindcss: {
			functions: ['cn'],
			stylesheet: './apps/web/src/app/globals.css',
		},
	},
	lint: {
		extends: [baseConfig, reactConfig],
		ignorePatterns: ['**/*.generated.ts', '**/*generated*.ts'],
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
		options: {
			reportUnusedDisableDirectives: 'warn',
			typeAware: true,
			typeCheck: true,
		},
		overrides: [
			{
				files: ['**/*.test.ts', '**/*.test.tsx', '**/test-utils/**', '**/vitest.config.ts'],
				rules: {
					'max-lines': 'off',
					'max-lines-per-function': 'off',
					'no-magic-numbers': 'off',
					'sort-keys': 'off',
					'typescript/no-unsafe-type-assertion': 'off',
				},
			},
			{
				// The Playwright suite is neither Vitest nor application code: its specs are `.spec.ts`
				// files that import Playwright's own `test`, and the mock preload is a linear script that
				// reads its fixtures from disk before the server starts.
				files: ['e2e/**', '**/e2e/**', 'playwright*.config.ts', '**/playwright*.config.ts'],
				plugins: ['vitest'],
				rules: {
					'max-statements': 'off',
					'no-await-in-loop': 'off',
					'no-magic-numbers': 'off',
					'node/no-sync': 'off',
					'sort-keys': 'off',
					'typescript/no-unsafe-type-assertion': 'off',
					'vitest/consistent-test-filename': 'off',
					'vitest/no-conditional-in-test': 'off',
					'vitest/prefer-importing-vitest-globals': 'off',
					'vitest/require-hook': 'off',
				},
			},
			{
				// Lighthouse CI `require()`s its config file, and `apps/web` is `"type": "module"` — so the
				// file has to be CommonJS, and nothing about it can be typed. It is a tool's input, not
				// application code. `sort-keys` is off because `collect`/`assert`/`upload` read in the
				// order Lighthouse runs them.
				files: ['**/lighthouserc.cjs'],
				rules: {
					'import/no-commonjs': 'off',
					'sort-keys': 'off',
					'typescript/no-require-imports': 'off',
					'typescript/no-unsafe-argument': 'off',
					'typescript/no-unsafe-assignment': 'off',
					'typescript/no-unsafe-call': 'off',
					'typescript/no-unsafe-member-access': 'off',
					'typescript/no-var-requires': 'off',
				},
			},
			{
				files: ['**/*.tsx'],
				plugins: ['react', 'react-perf', 'nextjs'],
				rules: {
					'nextjs/google-font-display': 'warn',
					'nextjs/google-font-preconnect': 'warn',
					'nextjs/inline-script-id': 'warn',
					'nextjs/next-script-for-ga': 'warn',
					'nextjs/no-assign-module-variable': 'warn',
					'nextjs/no-async-client-component': 'warn',
					'nextjs/no-before-interactive-script-outside-document': 'warn',
					'nextjs/no-css-tags': 'warn',
					'nextjs/no-document-import-in-page': 'warn',
					'nextjs/no-duplicate-head': 'warn',
					'nextjs/no-head-element': 'warn',
					'nextjs/no-head-import-in-document': 'warn',
					'nextjs/no-html-link-for-pages': 'warn',
					'nextjs/no-img-element': 'warn',
					'nextjs/no-page-custom-font': 'warn',
					'nextjs/no-script-component-in-head': 'warn',
					'nextjs/no-styled-jsx-in-document': 'warn',
					'nextjs/no-sync-scripts': 'warn',
					'nextjs/no-title-in-document-head': 'warn',
					'nextjs/no-typos': 'warn',
					'nextjs/no-unwanted-polyfillio': 'warn',
					'react-perf/jsx-no-jsx-as-prop': 'off',
					'react-perf/jsx-no-new-array-as-prop': 'off',
					'react-perf/jsx-no-new-function-as-prop': 'off',
					'react-perf/jsx-no-new-object-as-prop': 'off',
					'react/forbid-component-props': 'off',
					'react/jsx-no-literals': 'off',
					'react/only-export-components': [
						'warn',
						{ allowExportNames: ['generateMetadata', 'metadata'] },
					],
					'typescript/no-misused-promises': 'off',
					'typescript/no-unnecessary-condition': 'off',
					'typescript/strict-void-return': 'off',
				},
			},
			tailwindcssOverride(['apps/web/**'], 'apps/web/src/app/globals.css', {
				'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
				// `not-prose` comes from `@tailwindcss/typography`, which the plugin does not resolve, and
				// `sub-title` is a hook class styled in the base layer of `globals.css`
				'better-tailwindcss/no-unknown-classes': ['error', { ignore: ['not-prose', 'sub-title'] }],
			}),
			{
				files: ['apps/studio/**/*.jsx', 'apps/studio/**/*.tsx'],
				plugins: [...reactConfig.overrides[0].plugins],
				rules: {
					'jsx-a11y/prefer-tag-over-role': 'off',
				},
			},
			tailwindcssOverride(['packages/email/**'], 'packages/email/tailwind.config.css', {
				'better-tailwindcss/enforce-canonical-classes': 'off',
				'better-tailwindcss/enforce-consistent-class-order': 'off',
				'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
				'better-tailwindcss/no-unknown-classes': [
					'warn',
					{ ignore: ['email-container', 'gutter', 'stack', 'stack-gap'] },
				],
			}),
			{
				files: ['packages/email/**/*.jsx', 'packages/email/**/*.tsx'],
				plugins: [...reactConfig.overrides[0].plugins],
				rules: {
					'jsx-a11y/prefer-tag-over-role': 'off',
				},
			},
		],
		rules: {
			'no-underscore-dangle': 'off',
			'typescript/prefer-readonly-parameter-types': 'off',
			'typescript/strict-boolean-expressions': 'off',
			'vite-plus/prefer-vite-plus-imports': 'error',
		},
	},
	test: {
		// `vp test` at the root runs each workspace's own `vitest.config.ts` as a project. Coverage and
		// its thresholds are per workspace and only apply there: gate on `pnpm run test:coverage`, not
		// on `vp test --coverage` from the root.
		projects: ['apps/*', 'packages/*'],
	},
});
