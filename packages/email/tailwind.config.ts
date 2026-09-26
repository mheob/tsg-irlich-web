import { pixelBasedPreset } from 'react-email';
import type { TailwindConfig } from 'react-email';

/**
 * Hex counterparts of the `oklch` design tokens in `apps/web/src/app/globals.css`.
 * E-mail clients like Outlook and Gmail on the web do not support `oklch`.
 */
export const tailwindConfig: TailwindConfig = {
	presets: [pixelBasedPreset],
	theme: {
		extend: {
			colors: {
				background: '#ffffff',
				'background-high-contrast': '#e1e1e1',
				'background-low-contrast': '#f2f2f2',
				border: '#b4b4b4',
				foreground: '#161616',
				'muted-foreground': '#424853',
				primary: '#332c61',
				'primary-foreground': '#fcfcfc',
				secondary: '#ffd404',
				'secondary-dark': '#cf9b00',
				'secondary-foreground': '#161616',
			},
			fontFamily: {
				heading: ['Impact', "'Arial Narrow Bold'", "'Arial Black'", 'sans-serif'],
				sans: ['-apple-system', "'Segoe UI'", 'Roboto', 'Arial', 'sans-serif'],
			},
		},
	},
};
