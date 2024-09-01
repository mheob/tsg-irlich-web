/* eslint-disable perfectionist/sort-objects */

import defaultConfig from '@mheob/prettier-config';

/** @type {import('prettier').Options} */
export default {
	...defaultConfig,
	plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],
	overrides: [
		...defaultConfig.overrides,
		{
			files: '*.astro',
			options: {
				parser: 'astro',
			},
		},
	],
};
