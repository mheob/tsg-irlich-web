import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	plugins: [],
	theme: {
		colors: {
			black: '#000000',
			brand: {
				dark: '#312b5d',
				DEFAULT: '#2E2B70',
				light: '#5650be',
			},
			'brand-secondary': {
				dark: '#d09d00',
				DEFAULT: '#fed501',
				light: '#ffe40e',
			},
			current: 'currentColor',
			gray: {
				DEFAULT: '#3b3b4f',
				light: '#dfdfe6',
			},
			transparent: 'transparent',
			white: '#ffffff',
		},
		extend: {
			fontFamily: {
				sans: ['Inter', ...defaultTheme.fontFamily.sans],
				'sans-serif': ['Anton', ...defaultTheme.fontFamily.sans],
			},
		},
	},
};
