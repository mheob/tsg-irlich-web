import { baseConfig, reactConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
	extends: [baseConfig, reactConfig],
	ignorePatterns: ['**/*.generated.ts', '**/*generated*.ts'],
	overrides: [
		{
			files: ['**/*.tsx'],
			plugins: ['react', 'nextjs'],
			// oxlint-disable-next-line sort-keys
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
				'react/only-export-components': [
					'warn',
					{ allowExportNames: ['generateMetadata', 'metadata'] },
				],

				// TODO: remove after `@mheob/oxlint-config` is updated
				'eslint/max-lines-per-function': 'off',
				'eslint/max-statements': 'off',
				'react/jsx-filename-extension': ['warn', { extensions: ['jsx', 'tsx'] }],
				'react/jsx-max-depth': ['warn', { max: 10 }],
				'react/jsx-props-no-spreading': 'off',
				'react/no-multi-comp': 'off',
				'react/react-in-jsx-scope': 'off',
				'typescript/explicit-module-boundary-types': 'off',
			},
		},
	],
	// TODO: remove after `@mheob/oxlint-config` is updated
	rules: {
		'eslint/capitalized-comments': 'off',
		'eslint/curly': 'warn',
		'eslint/id-length': 'off',
		'eslint/no-magic-numbers': [
			'warn',
			{
				ignore: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
				ignoreArrayIndexes: true,
				ignoreDefaultValues: true,
				ignoreEnums: true,
				ignoreTypeIndexes: true,
			},
		],
		'eslint/no-plusplus': 'off',
		'eslint/no-undef': 'off',
		'eslint/no-undefined': 'off',
		'import/max-dependencies': ['warn', { max: 20 }],
		'import/no-relative-parent-imports': 'off',
		'import/unambiguous': 'off',
		'oxc/no-async-await': 'off',
		'oxc/no-optional-chaining': 'off',
		'unicorn/no-null': 'off',
	},
});
