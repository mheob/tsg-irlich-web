import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
	content: ['./src/{app,components,icons}/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			colors: {
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				background: {
					DEFAULT: 'hsl(var(--background))',
					highContrast: 'hsl(var(--background-high-contrast))',
					lowContrast: 'hsl(var(--background-low-contrast))',
				},
				black: 'hsl(var(--black))',
				border: 'hsl(var(--border))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				foreground: 'hsl(var(--foreground))',
				input: 'hsl(var(--input))',
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					dark: 'hsl(var(--primary-dark))',
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
				},
				ring: 'hsl(var(--ring))',
				secondary: {
					dark: 'hsl(var(--secondary-dark))',
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					light: 'hsl(var(--secondary-light))',
				},
				white: 'hsl(var(--white))',
			},
			container: {
				center: true,
				/* eslint-disable perfectionist/sort-objects */
				padding: {
					DEFAULT: '0.5rem',
					sm: '1rem',
					lg: '1.5rem',
					xl: '2rem',
					'2xl': '2.5rem',
				},
				/* eslint-enable perfectionist/sort-objects */
			},
			fontFamily: {
				sans: ['Inter', ...defaultTheme.fontFamily.sans],
				'sans-serif': ['Anton', ...defaultTheme.fontFamily.sans],
				serif: ['Bebas Neue', ...defaultTheme.fontFamily.serif],
			},
		},
	},
};

export default config;
