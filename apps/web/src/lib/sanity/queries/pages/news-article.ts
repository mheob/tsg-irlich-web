import { defineQuery } from 'next-sanity';

import { blockContent, featuredImage, meta } from '@/lib/sanity/queries';

/**
 * Query to get the news article hero
 *
 * @returns The news article hero
 */
const newsArticleHeroQuery = defineQuery(`
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
const newsArticleContentQuery = defineQuery(`
	*[_type == 'news.article' && slug.current == $slug][0] {
		author -> {
			email,
			firstName,
			image,
			lastName,
			jobTitle,
		},
		body[] {
			...,
			_type == "blockContent" => { ${blockContent} },
			_type == "grid" => {
				items[] {
					...,
					_type == "blockContent" => { ${blockContent} }
				}
			}
		},
		categories[] -> {
			"slug": slug.current,
			title
		},
		excerpt,
		${featuredImage},
		${meta},
		publishedAt,
		"slug": slug.current,
		title,
	}
`);

export { newsArticleHeroQuery, newsArticleContentQuery };
