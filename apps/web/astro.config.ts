import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/static';
import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

import { apiVersion, dataset, projectId } from './src/env';

// https://astro.build/config
export default defineConfig({
	adapter: vercel({
		imagesConfig: {
			domains: ['cdn.sanity.io'],
			formats: ['image/avif', 'image/webp'],
			sizes: [160, 320, 640, 1280],
		},
		imageService: true,
	}),
	image: {
		domains: ['cdn.sanity.io'],
	},
	integrations: [
		icon(),
		react(),
		sanity({
			apiVersion,
			dataset,
			projectId,
			useCdn: true,
		}),
		tailwind({
			applyBaseStyles: false,
		}),
	],
	output: 'static',
});
