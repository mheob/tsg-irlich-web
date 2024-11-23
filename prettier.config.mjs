import defaultConfig from '@mheob/prettier-config';

/** @type {import('prettier').Options} */
export default {
	...defaultConfig,
	plugins: ['prettier-plugin-tailwindcss'],
};
