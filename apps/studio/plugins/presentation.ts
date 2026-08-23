import type { PluginOptions } from 'sanity';
import type { DocumentLocationResolver } from 'sanity/presentation';
import { defineDocuments, presentationTool } from 'sanity/presentation';

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
 * Queries that resolve the pages a document appears on. They project the location state directly,
 * because the `select` of `defineLocations` only understands plain field paths and chokes on the
 * dereference that is needed to read the slug of a referenced category.
 */
const LOCATION_QUERIES: Record<string, string> = {
	'news.article': `*[_id == $id][0] {
		"locations": array::compact([
			select(
				defined(slug.current) && defined(categories[0]->slug.current) => {
					"href": "/news/" + categories[0]->slug.current + "/" + slug.current,
					"title": coalesce(title, "Ohne Titel")
				}
			),
			{ "href": "/news", "title": "Alle News" }
		])
	}`,
	'news.category': `*[_id == $id][0] {
		"locations": array::compact([
			select(
				defined(slug.current) => {
					"href": "/news/" + slug.current,
					"title": coalesce(title, "Ohne Titel")
				}
			),
			{ "href": "/news", "title": "Alle News" }
		])
	}`,
};

/**
 * Resolves the pages a document appears on for the "Verwendet auf" panel.
 *
 * @param params - The document that is currently open, plus the active perspective.
 * @param context - The studio context, used to subscribe to the location query.
 * @returns The document locations, or `null` for documents without their own page.
 */
const locations: DocumentLocationResolver = (params, context) => {
	const { id, perspectiveStack, type, variant } = params;
	const query = LOCATION_QUERIES[type];

	if (!query) {
		return null;
	}

	return context.documentStore.listenQuery(
		query,
		{ id },
		{
			perspective: perspectiveStack.length > 0 ? perspectiveStack : 'drafts',
			tag: 'presentation.locations',
			variant,
		},
	);
};

/**
 * The presentation tool, which renders the website in an iframe next to the document editor and
 * lets the editors preview their drafts.
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
