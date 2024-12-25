import { defineQuery } from 'next-sanity';

import { featuredImage } from '@/lib/sanity/queries';

export const newsArticle = /* groq */ `
	_id,
	publishedAt,
	author->{ firstName, lastName, image },
	categories[]->{ title, "slug": slug.current },
	excerpt,
	${featuredImage},
	"slug": slug.current,
	title,
`;

export const newsArticlesQuery = defineQuery(`
	*[_type == 'news.article'] | order(publishedAt desc) [0..2] {
		${newsArticle}
	}
`);

/** IMPORTANT: The params `start` and `end` are required */
export const newsArticlesPaginatedQuery = defineQuery(`
	*[_type == 'news.article'] | order(publishedAt desc) [$start..$end] { // $start = 3, $end = 8
		${newsArticle}
	}
`);

export const newsArticlesTotalQuery = defineQuery(`count(*[_type == "news.article"])`);

/** IMPORTANT: The params `slug` is required */
export const newsCategoryQuery = defineQuery(`
	*[_type == 'news.category' && slug.current == $slug][0] {
		"slug": slug.current,
		title
	}
`);
