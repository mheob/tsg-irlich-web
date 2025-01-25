import { defineQuery } from 'next-sanity';

import { featuredImage } from '@/lib/sanity/queries';

export const newsArticleHeroQuery = defineQuery(`
	*[_type == 'news-article-page'][0] {
		title,
		subtitle,
	}
`);

/** **IMPORTANT:** The param `slug` is required */
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
		${featuredImage},
		publishedAt,
		"slug": slug.current,
		title,
	}
`);
