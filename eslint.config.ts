import { mheob } from '@mheob/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';

export default mheob(
	{
		react: true,
	},
	{
		ignores: ['.sonarlint', '**/*.generated.*', 'apps/studio/schema.json'],
	},
	{
		files: ['**/*.ts?(x)'],
		rules: {
			'react-refresh/only-export-components': [
				'warn',
				{ allowExportNames: ['dynamic', 'metadata', 'revalidate'] },
			],
		},
	},
	{
		files: ['apps/studio/{schemas,shared,utils/documents}/**/*.ts?(x)'],
		rules: {
			'perfectionist/sort-objects': 'off',
		},
	},
	{
		files: ['apps/web/src/**/*.ts?(x)'],
		name: 'Next Plugin',
		plugins: {
			'@next/next': nextPlugin,
			rules: {
				...nextPlugin.configs.recommended.rules,
				...nextPlugin.configs['core-web-vitals'].rules,
			},
		},
	},
);
