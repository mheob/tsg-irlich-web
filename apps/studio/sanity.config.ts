import { assist } from '@sanity/assist';
import { deDELocale } from '@sanity/locale-de-de';
import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';

import { Logo } from './src/components/logo';
import { schemaTypes } from './src/schemas';
import { deskStructure } from './src/structure';

export default defineConfig({
	dataset: import.meta.env.SANITY_STUDIO_DATASET,
	icon: Logo,
	name: 'default',
	plugins: [
		structureTool({ structure: deskStructure }),
		media(),
		visionTool(),
		deDELocale(),
		assist(),
	],
	projectId: import.meta.env.SANITY_STUDIO_PROJECT_ID,
	schema: {
		types: schemaTypes,
	},
	title: 'TSG Irlich 1882',
});
