import { pixelBasedPreset, type TailwindConfig } from '@react-email/components';

export const tailwindConfig: TailwindConfig = {
	presets: [pixelBasedPreset],
	theme: {
		extend: {
			colors: {
				'background-high-contrast': 'oklch(0.91 0 286)',
				border: 'oklch(0.77 0 266)',
				primary: 'oklch(0.33 0.09 286)',
				'primary-foreground': 'oklch(0.99 0 0)',
				secondary: 'oklch(0.88 0.18 94)',
				'secondary-foreground': 'oklch(0.20 0 0)',
			},
		},
	},
};
