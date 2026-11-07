import { defineQuery } from 'next-sanity';

/**
 * Query to get news articles for RSS feed
 *
 * The author is named, not addressed: the feed is public, and the site never shows a person's email
 * address in its markup (WEB-424).
 *
 * @returns Latest 50 news articles with all required RSS fields
 */
export const rssNewsArticlesQuery = defineQuery(`
	*[_type == 'news.article' && defined(publishedAt)] | order(publishedAt desc) [0..49] {
		title,
		excerpt,
		"slug": slug.current,
		"category": categories[0]->slug.current,
		"categoryTitle": categories[0]->title,
		"author": author->{ firstName, lastName },
		featuredImage,
		publishedAt,
		_updatedAt
	}
`);
