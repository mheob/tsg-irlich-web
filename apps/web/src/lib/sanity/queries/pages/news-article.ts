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
		_updatedAt,
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
		downloads[] {
			_key,
			title,
			document {
				asset -> {
					originalFilename,
					size,
					url,
				}
			}
		},
		excerpt,
		${featuredImage},
		${meta},
		publishedAt,
		"slug": slug.current,
		title,
	}
`);

/**
 * Query to find the current address of an article that used to have another slug
 *
 * Only an article with a page is a candidate: a slug and a first category with a slug. One without
 * would win the `[0]` and then be rejected as an incomplete address, which hides a complete one
 * behind it. The perspective decides which versions are candidates, as for the departments (see
 * `departmentRedirectQuery`). Two articles may list the same former slug, so the most recently
 * updated one wins and the id breaks a tie, which makes every request answer the same.
 *
 * @param slug - The slug that no article uses any more
 * @returns The current slug and first category of the article that used to have it, or `null`
 */
const newsArticleRedirectQuery = defineQuery(`
	*[
		_type == 'news.article' &&
		$slug in previousSlugs &&
		defined(slug.current) &&
		defined(categories[0]->slug.current) &&
		!(_id in path('drafts.**'))
	] | order(_updatedAt desc, _id asc)[0] {
		"category": categories[0]->slug.current,
		"slug": slug.current,
	}
`);

export { newsArticleHeroQuery, newsArticleContentQuery, newsArticleRedirectQuery };
