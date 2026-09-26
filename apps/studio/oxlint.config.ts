import { reactConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'oxlint';

import baseConfig from '../../oxlint.config.ts';

export default defineConfig({
	extends: [baseConfig],
	overrides: [
		{
			files: ['**/*.jsx', '**/*.tsx'],
			plugins: [...reactConfig.overrides[0].plugins],
			rules: {
				'jsx-a11y/prefer-tag-over-role': 'off',
			},
		},
	],
});
