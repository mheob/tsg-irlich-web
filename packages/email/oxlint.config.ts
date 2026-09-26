import path from 'node:path';

import { reactConfig, tailwindcssConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'oxlint';

import baseConfig from '../../oxlint.config.ts';

export default defineConfig({
	extends: [baseConfig, tailwindcssConfig()],

	settings: {
		// Resolved against the config file, not the working directory the linter was started from
		'better-tailwindcss': { entryPoint: path.join(import.meta.dirname, 'tailwind.config.css') },
	},

	rules: {
		'better-tailwindcss/enforce-canonical-classes': 'off',
		'better-tailwindcss/enforce-consistent-class-order': 'off',
		'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
		'better-tailwindcss/no-unknown-classes': [
			'warn',
			{ ignore: ['email-container', 'gutter', 'stack', 'stack-gap'] },
		],
	},

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
