/* eslint-disable node/prefer-global/process */

import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
	api: {
		dataset: process.env.SANITY_STUDIO_DATASET,
		projectId: process.env.SANITY_STUDIO_PROJECT_ID,
	},
});
