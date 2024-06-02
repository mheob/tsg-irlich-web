import { mheob } from '@mheob/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';

export default mheob(
	// Configures mheob's config
	{
		react: true,
	},
	// From the second arguments they are ESLint Flat Configs you can have multiple configs
	{
		files: ['apps/web/**/*.{ts,tsx}'],
		plugins: {
			'@next/next': nextPlugin,
		},
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs['core-web-vitals'].rules,
		},
	},
	{
		files: ['apps/studio/src/schemas/**/*.ts'],
		// "extends": "@sanity/eslint-config-studio"
		rules: {
			'perfectionist/sort-objects': 'off',
		},
	},
);
