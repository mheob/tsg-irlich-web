import { defineQuery } from 'next-sanity';

import { featuredImage } from '@/lib/sanity/queries';

/**
 * Query to get the news article hero
 *
 * @returns The news article hero
 */
export const newsArticleHeroQuery = defineQuery(`
	*[_type == 'news-article-page'][0] {
		title,
		subtitle,
	}
`);

/**
 * Query to get the news article content
 *
 * @param slug - The slug of the news article
 * @returns The news article content
 */
export const newsArticleContentQuery = defineQuery(`
	*[_type == 'news.article' && slug.current == $slug][0] {
		author -> {
			email,
			firstName,
			image,
			lastName,
			jobTitle,
		},
		body[],
		categories[] -> {
			"slug": slug.current,
			title
		},
		excerpt,
		${featuredImage},
		publishedAt,
		"slug": slug.current,
		title,
	}
`);
