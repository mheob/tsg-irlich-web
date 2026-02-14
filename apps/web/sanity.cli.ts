import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
	api: {
		dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
		projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
	},
});
