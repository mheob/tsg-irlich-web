import { baseConfig } from '@mheob/oxfmt-config';
import { defineConfig } from 'oxfmt';

export default defineConfig({
	...baseConfig,
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
			['type-parent', 'value-parent', 'type-sibling', 'value-sibling', 'type-index', 'value-index'],
			'style',
			'unknown',
		],
	},
	sortTailwindcss: {
		functions: ['cn'],
		stylesheet: './apps/web/src/app/globals.css',
	},
});
