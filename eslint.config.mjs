import { mheob } from '@mheob/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';

export default mheob(
	// Configures mheob's config
	{
		react: true,
	},
	// From the second arguments they are ESLint Flat Configs you can have multiple configs
	{
		ignores: ['.github', '.sonarlint', '**/*.generated.*', 'apps/studio/schema.json'],
	},
	{
		rules: {
			'react-refresh/only-export-components': 'off',
		},
	},
	{
		name: 'Next Plugin',
		plugins: {
			'@next/next': nextPlugin,
			rules: {
				...nextPlugin.configs.recommended.rules,
				...nextPlugin.configs['core-web-vitals'].rules,
			},
		},
	},
	{
		rules: {
			// TODO: remove rule after https://github.com/mheob/config/issues/185 is resolved
			'import/order': 'off',
			'sort-imports': 'off',
		},
	},
	{
		files: ['apps/studio/{schemas,shared}/**/*.ts?(x)'],
		rules: {
			'perfectionist/sort-objects': 'off',
		},
	},
);
