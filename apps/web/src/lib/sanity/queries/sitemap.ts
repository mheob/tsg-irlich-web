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
 * Query to get all departments for the sitemap
 *
 * A department without a slug has no page, so it is left out here.
 *
 * @returns All departments with slug and updated date
 */
const sitemapDepartmentsQuery = defineQuery(`
	*[_type == 'department' && defined(slug.current)] {
		"slug": slug.current,
		"lastModified": _updatedAt
	}
`);

/**
 * Query to get all groups (teams) for the sitemap
 *
 * A group lives below its department, so one whose department is gone or has no slug has no page
 * and is left out here.
 *
 * @returns All groups with type, department slug, slug and updated date
 */
const sitemapGroupsQuery = defineQuery(`
	*[_type == 'group' && defined(department->slug.current)] {
		_type,
		"department": department->slug.current,
		"slug": slug.current,
		"lastModified": _updatedAt
	}
`);

/**
 * Query to get every finished and findable TSG-Echo issue for the sitemap
 *
 * @returns The slug and the last modification date of every finished and findable issue
 */
const sitemapEchoIssuesQuery = defineQuery(`
	*[${finishedEchoIssue} && indexable != false] {
		"slug": slug.current,
		"lastModified": _updatedAt
	}
`);

export {
	sitemapDepartmentsQuery,
	sitemapEchoIssuesQuery,
	sitemapGroupsQuery,
	sitemapNewsArticlesQuery,
	sitemapNewsCategoriesQuery,
};
