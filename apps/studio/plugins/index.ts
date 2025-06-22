/* eslint-disable node/prefer-global/process */

import { deDELocale } from '@sanity/locale-de-de';
import { visionTool } from '@sanity/vision';
import type { PluginOptions } from 'sanity';
import { media } from 'sanity-plugin-media';
import { structureTool } from 'sanity/structure';

import aboutUsPage from '@/schemas/single-pages/about-us';
import contactPage from '@/schemas/single-pages/contact';
import groupsPage from '@/schemas/single-pages/groups';
import homePage from '@/schemas/single-pages/home';
import imprintPage from '@/schemas/single-pages/imprint';
import membershipPage from '@/schemas/single-pages/membership';
import newsArticlePage from '@/schemas/single-pages/news-article';
import newsOverviewPage from '@/schemas/single-pages/news-overview';
import newsOverviewCategoryPage from '@/schemas/single-pages/news-overview-category';
import departmentsPage from '@/schemas/single-pages/offer';
import privacyPage from '@/schemas/single-pages/privacy';
import singleGroupPage from '@/schemas/single-pages/single-group';
import siteSettings from '@/schemas/singletons/site-settings';

import { assistWithPresets } from './assist';
import { pageStructure, singletonPlugin } from './singleton';

export function getPlugins(): PluginOptions[] {
	const plugins: PluginOptions[] = [
		deDELocale(),
		structureTool({
			structure: pageStructure([
				homePage,
				aboutUsPage,
				contactPage,
				departmentsPage,
				membershipPage,
				newsArticlePage,
				newsOverviewPage,
				newsOverviewCategoryPage,
				groupsPage,
				singleGroupPage,
				privacyPage,
				imprintPage,
				siteSettings,
			]),
		}),
		// Configures the global "new document" button, and document actions,
		// to suit the Settings document singleton
		singletonPlugin([
			homePage.name,
			aboutUsPage.name,
			contactPage.name,
			membershipPage.name,
			newsArticlePage.name,
			newsOverviewPage.name,
			newsOverviewCategoryPage.name,
			groupsPage.name,
			singleGroupPage.name,
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
