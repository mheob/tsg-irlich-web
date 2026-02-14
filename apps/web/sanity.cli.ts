import { defineCliConfig } from 'sanity/cli';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
if (!projectId) {
	throw new Error(
		'Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable required for Sanity CLI configuration.',
	);
}
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export default defineCliConfig({
	api: {
		dataset,
		projectId,
	},
});
