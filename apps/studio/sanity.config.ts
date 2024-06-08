/* eslint-disable node/prefer-global/process */

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
	dataset: process.env.SANITY_API_DATASET || 'production',
	icon: Logo,
	name: 'default',
	plugins: [
		structureTool({ structure: deskStructure }),
		media(),
		visionTool(),
		deDELocale(),
		assist(),
	],
	projectId: process.env.SANITY_API_PROJECT_ID || 'MISSING_PROJECT_ID_IN_ENV',
	schema: {
		types: schemaTypes,
	},
	title: 'TSG Irlich 1882',
	token: process.env.SANITY_API_WRITE_TOKEN,
});
