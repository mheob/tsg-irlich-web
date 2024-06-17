/* eslint-disable node/prefer-global/process */

import { deDELocale } from '@sanity/locale-de-de';
import { visionTool } from '@sanity/vision';
import type { PluginOptions } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';

import contactPage from '@/schemas/single-pages/contact';
import homePage from '@/schemas/single-pages/home';
import imprintPage from '@/schemas/single-pages/imprint';
import membershipPage from '@/schemas/single-pages/membership';
import newsArticlePage from '@/schemas/single-pages/news-article';
import newOverviewPage from '@/schemas/single-pages/news-overview';
import privacyPage from '@/schemas/single-pages/privacy';
import siteSettings from '@/schemas/singletons/site-settings';

import { assistWithPresets } from './assist';
import { pageStructure, singletonPlugin } from './singleton';

export function getPlugins() {
	const plugins: PluginOptions[] = [
		deDELocale(),
		structureTool({
			structure: pageStructure([
				homePage,
				contactPage,
				membershipPage,
				newsArticlePage,
				newOverviewPage,
				privacyPage,
				imprintPage,
				siteSettings,
			]),
		}),
		// Configures the global "new document" button, and document actions,
		// to suit the Settings document singleton
		singletonPlugin([
			homePage.name,
			contactPage.name,
			membershipPage.name,
			newsArticlePage.name,
			newOverviewPage.name,
			privacyPage.name,
			imprintPage.name,
			siteSettings.name,
		]),
		media(),
		assistWithPresets(),
	];

	if (process.env.NODE_ENV === 'development') plugins.push(visionTool());

	return plugins;
}
