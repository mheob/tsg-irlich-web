// oxlint-disable node/no-process-env

import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
	api: {
		dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
		projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
	},
	typegen: {
		generates: './src/types/sanity.types.generated.ts',
		overloadClientMethods: true,
		path: './src/lib/sanity/**/*.{ts,tsx,js,jsx}',
		schema: '../studio/schema.json',
	},
});
