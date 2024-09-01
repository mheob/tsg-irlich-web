import { mheob } from '@mheob/eslint-config';

export default mheob(
	// Configures mheob's config
	{
		astro: true,
	},
	// From the second arguments they are ESLint Flat Configs you can have multiple configs
	{
		ignores: [],
	},
	{
		rules: {
			// TODO: remove rule after https://github.com/mheob/config/issues/185 is resolved
			'import/order': 'off',
			'sort-imports': 'off',
		},
	},
	{
		files: ['**/*.astro'],
		rules: {
			'unicorn/filename-case': ['error', { cases: { kebabCase: true, pascalCase: true } }],
		},
	},
	{
		files: ['apps/studio/{schemas,shared}/**/*.{ts,tsx}'],
		// "extends": "@sanity/eslint-config-studio"
		rules: {
			'perfectionist/sort-objects': 'off',
		},
	},
);
