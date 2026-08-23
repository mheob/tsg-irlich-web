import type { PluginOptions } from 'sanity';
import { defineDocuments, defineLocations, presentationTool } from 'sanity/presentation';

import { previewUrl } from '@/env';

const ALLOWED_ORIGINS = ['http://localhost:*', 'https://*.vercel.app', 'https://www.tsg-irlich.de'];

/**
 * Maps the routes of the website to the documents that are rendered on them.
 * The first matching route wins, so the more specific ones come first.
 */
const mainDocuments = defineDocuments([
	{ filter: `_type == "news.article" && slug.current == $slug`, route: '/news/:category/:slug' },
	{ filter: `_type == "news.category" && slug.current == $category`, route: '/news/:category' },
	{ route: '/news', type: 'newsOverview' },
]);

/**
 * Narrows a selected document field to a non-empty string.
 *
 * @param value - The selected field, which is untyped in a location resolver.
 * @returns The value if it is a non-empty string, otherwise `undefined`.
 */
function getString(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Maps the documents to the pages of the website they appear on. This powers
 * the "Verwendet auf" links in the studio.
 */
const locations = {
	'news.article': defineLocations({
		resolve: (document) => {
			const category = getString(document?.category);
			const slug = getString(document?.slug);
			const title = getString(document?.title) ?? 'Ohne Titel';

			return {
				locations: [
					...(category && slug ? [{ href: `/news/${category}/${slug}`, title }] : []),
					{ href: '/news', title: 'Alle News' },
				],
			};
		},
		select: { category: 'categories[0]->slug.current', slug: 'slug.current', title: 'title' },
	}),
	'news.category': defineLocations({
		resolve: (document) => {
			const slug = getString(document?.slug);
			const title = getString(document?.title) ?? 'Ohne Titel';

			return {
				locations: [
					...(slug ? [{ href: `/news/${slug}`, title }] : []),
					{ href: '/news', title: 'Alle News' },
				],
			};
		},
		select: { slug: 'slug.current', title: 'title' },
	}),
};

/**
 * The presentation tool, which renders the website in an iframe next to the
 * document editor and lets the editors preview their drafts.
 *
 * @returns The configured presentation tool.
 */
export function presentationWithPreview(): PluginOptions {
	return presentationTool({
		allowOrigins: ALLOWED_ORIGINS,
		previewUrl: {
			initial: previewUrl,
			previewMode: {
				disable: '/api/draft-mode/disable',
				enable: '/api/draft-mode/enable',
			},
		},
		resolve: { locations, mainDocuments },
	});
}
