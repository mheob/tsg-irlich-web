import { defineQuery } from 'next-sanity';

/**
 * Query to get all news articles for the sitemap
 *
 * @returns All news articles with slug, category, and updated date
 */
export const sitemapNewsArticlesQuery = defineQuery(`
	*[_type == 'news.article'] | order(publishedAt desc) [0..9999] {  // Sitemap limit
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
export const sitemapNewsCategoriesQuery = defineQuery(`
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
export const sitemapGroupsQuery = defineQuery(`
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
