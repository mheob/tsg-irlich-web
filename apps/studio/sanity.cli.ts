/* eslint-disable node/prefer-global/process, unicorn/prefer-module */

import { defineCliConfig } from 'sanity/cli';

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;

export default defineCliConfig({
	api: { dataset, projectId },
	vite: {
		define: {
			'process.env.SANITY_DATASET': JSON.stringify(dataset),
			'process.env.SANITY_PROJECT_ID': JSON.stringify(projectId),
		},
		resolve: {
			alias: {
				'@': __dirname,
			},
		},
	},
});
