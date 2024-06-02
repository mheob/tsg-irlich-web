import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';

import { schemaTypes } from './src/schemas';
import { deskStructure } from './src/structure';

export default defineConfig({
	dataset: import.meta.env.SANITY_STUDIO_DATASET ?? 'production',
	name: 'default',

	plugins: [media(), structureTool({ structure: deskStructure }), visionTool()],

	projectId: import.meta.env.SANITY_STUDIO_PROJECT_ID ?? '',
	schema: {
		types: schemaTypes,
	},

	title: 'TSG Irlich 1882',
});
