import defaultConfig from '@mheob/prettier-config';

/** @type {import('prettier').Options} */
export default {
	...defaultConfig,
	overrides: [
		...defaultConfig.overrides,
		{
			files: '*.astro',
			options: {
				parser: 'astro',
			},
		},
	],
	plugins: ['prettier-plugin-astro'],
};
