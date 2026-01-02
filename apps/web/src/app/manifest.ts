import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		background_color: '#ffffff',
		description:
			'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
		display: 'standalone',
		icons: [
			{
				purpose: 'maskable',
				sizes: 'any',
				src: '/icon.svg',
				type: 'image/svg+xml',
			},
			{
				sizes: '192x192',
				src: '/icon-192.png',
				type: 'image/png',
			},
			{
				sizes: '512x512',
				src: '/icon-512.png',
				type: 'image/png',
			},
			{
				purpose: 'maskable',
				sizes: '512x512',
				src: '/icon-mask.png',
				type: 'image/png',
			},
		],
		lang: 'de',
		name: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
		short_name: 'TSG Irlich',
		start_url: '/',
		theme_color: '#2e2b70',
	};
}
