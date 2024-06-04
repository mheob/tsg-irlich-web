import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';

import { dataset, projectId } from './env';
import { schemaTypes } from './src/schemas';
import { deskStructure } from './src/structure';

export default defineConfig({
	dataset,
	name: 'default',

	plugins: [structureTool({ structure: deskStructure }), media(), visionTool()],

	projectId,
	schema: {
		types: schemaTypes,
	},

	title: 'TSG Irlich 1882',
});
