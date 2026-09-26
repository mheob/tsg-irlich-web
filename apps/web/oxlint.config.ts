import path from 'node:path';

import { tailwindcssConfig } from '@mheob/oxlint-config';
import { defineConfig } from 'oxlint';

import baseConfig from '../../oxlint.config.ts';

export default defineConfig({
	extends: [baseConfig, tailwindcssConfig()],
	// `extends` does not carry `ignorePatterns` over, so the generated Sanity types would be linted
	ignorePatterns: baseConfig.ignorePatterns,

	settings: {
		// Resolved against the config file, not the working directory the linter was started from
		'better-tailwindcss': { entryPoint: path.join(import.meta.dirname, 'src/app/globals.css') },
	},

	rules: {
		'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
		// `not-prose` comes from `@tailwindcss/typography`, which the plugin does not resolve, and
		// `sub-title` is a hook class styled in the base layer of `globals.css`
		'better-tailwindcss/no-unknown-classes': ['error', { ignore: ['not-prose', 'sub-title'] }],
	},
});
