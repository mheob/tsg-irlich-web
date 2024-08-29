import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';
import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';

import { apiVersion, dataset, projectId } from './src/env';

// https://astro.build/config
export default defineConfig({
	adapter: vercel(),
	integrations: [
		tailwind(),
		react(),
		sanity({
			apiVersion,
			dataset,
			projectId,
			useCdn: true,
		}),
	],
	output: 'server',
});
