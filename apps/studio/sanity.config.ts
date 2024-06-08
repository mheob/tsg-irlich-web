import { deDELocale } from '@sanity/locale-de-de';
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';

import { dataset, projectId } from './env';
import { Logo } from './src/components/logo';
import { schemaTypes } from './src/schemas';
import { deskStructure } from './src/structure';

export default defineConfig({
	dataset,
	icon: Logo,
	name: 'default',
	plugins: [structureTool({ structure: deskStructure }), media(), visionTool(), deDELocale()],
	projectId,
	schema: {
		types: schemaTypes,
	},
	title: 'TSG Irlich 1882',
});
