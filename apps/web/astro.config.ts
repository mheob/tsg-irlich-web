import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';
import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

import { apiVersion, dataset, projectId } from './src/env';

// https://astro.build/config
export default defineConfig({
	adapter: vercel(),
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
	output: 'server',
});
