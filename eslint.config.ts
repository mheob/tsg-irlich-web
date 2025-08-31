import { GLOB_MARKDOWN, GLOB_SRC, mheob } from '@mheob/eslint-config';
import nextPlugin from '@next/eslint-plugin-next';

export default mheob(
	{
		react: true,
	},
	{
		ignores: ['.sonarlint', '**/*.generated.*', 'apps/studio/schema.json'],
	},
	{
		files: [GLOB_MARKDOWN],
		rules: {
			'unicorn/filename-case': 'off',
		},
	},
	{
		files: [GLOB_SRC],
		rules: {
			'react-refresh/only-export-components': [
				'warn',
				{
					allowExportNames: [
						'dynamic',
						'dynamicParams',
						'revalidate',
						'fetchCache',
						'runtime',
						'preferredRegion',
						'maxDuration',
						'config',
						'generateStaticParams',
						'metadata',
						'generateMetadata',
						'viewport',
						'generateViewport',
					],
				},
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
