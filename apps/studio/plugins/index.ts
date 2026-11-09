// oxlint-disable node/no-process-env

import { deDELocale } from '@sanity/locale-de-de';
import { visionTool } from '@sanity/vision';
import type { PluginOptions } from 'sanity';
import { media } from 'sanity-plugin-media';
import { structureTool } from 'sanity/structure';

import { singlePages } from '@/schemas/single-pages';
import siteSettings from '@/schemas/singletons/site-settings';

import { assistWithPresets } from './assist';
import { presentationWithPreview } from './presentation';
import { pageStructure, singletonPlugin } from './singleton';

/**
 * The plugins for the studio.
 *
 * @returns The plugins for the studio.
 */
export function getPlugins(): PluginOptions[] {
	const plugins: PluginOptions[] = [
		deDELocale(),
		structureTool({
			structure: pageStructure([...singlePages, siteSettings]),
		}),
		// Configures the global "new document" button, and document actions,
		// To suit the Settings document singleton
		singletonPlugin([...singlePages, siteSettings].map(({ name }) => name)),
		media(),
		// The order of the tools above defines the order of the studio's top navigation:
		// Structure, Media, Presentation, Vision (development only) and the built-in Releases
		presentationWithPreview(),
		assistWithPresets(),
	];

	if (process.env.NODE_ENV === 'development') {
		plugins.push(visionTool());
	}

	return plugins;
}
