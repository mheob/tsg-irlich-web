import { defineQuery } from 'next-sanity';

import { finishedEchoIssue } from '@/lib/sanity/queries';

/**
 * Query to get all news articles for the sitemap
 *
 * Returns the latest 10,000 published news articles with slug, category,
 * and last modified date for sitemap generation.
 *
 * @returns All published news articles with slug, category, and last modified date
 */
const sitemapNewsArticlesQuery = defineQuery(`
	*[_type == 'news.article' && defined(publishedAt)] | order(publishedAt desc) [0..9999] {
		"slug": slug.current,
		"category": categories[0]->slug.current,
		"lastModified": _updatedAt
	}
`);

/**
 * Query to get all news categories for the sitemap
 *
 * @returns All news categories with slug and updated date
 */
const sitemapNewsCategoriesQuery = defineQuery(`
	*[_type == 'news.category'] {
		"slug": slug.current,
		"lastModified": _updatedAt
	}
`);

/**
 * Query to get all groups (teams) for the sitemap
 *
 * @returns All groups with slug, type, and updated date
 */
const sitemapGroupsQuery = defineQuery(`
	*[_type in [
		'group.soccer',
		'group.children-gymnastics',
		'group.courses',
		'group.taekwondo',
		'group.dance',
		'group.other-sports',
	]] {
		_type,
		"slug": slug.current,
		"lastModified": _updatedAt
	}
`);

/**
 * Query to get every finished TSG-Echo issue for the sitemap
 *
 * @returns The slug and the last modification date of every finished issue
 */
const sitemapEchoIssuesQuery = defineQuery(`
	*[${finishedEchoIssue}] {
		"slug": slug.current,
		"lastModified": _updatedAt
	}
`);

export {
	sitemapEchoIssuesQuery,
	sitemapNewsArticlesQuery,
	sitemapNewsCategoriesQuery,
	sitemapGroupsQuery,
};
