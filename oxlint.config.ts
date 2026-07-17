import { baseConfig, reactConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
	extends: [baseConfig, reactConfig],
	ignorePatterns: ['**/*.generated.ts', '**/*generated*.ts'],
	overrides: [
		{
			files: ['**/*.tsx'],
			plugins: ['react', 'nextjs'],
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
			},
		},
	],
	rules: {
		'no-underscore-dangle': 'off',
	},
});
