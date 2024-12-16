import { defineQuery } from 'next-sanity';

import { featuredImage } from '@/lib/sanity/queries';

const newsArticle = /* groq */ `
	_id,
	_updatedAt,
	author->{ firstName, lastName, image },
	categories[]->{ title, "slug": slug.current },
	excerpt,
	${featuredImage},
	"slug": slug.current,
	title,
`;

export const newsArticlesQuery = defineQuery(`
	*[_type == 'news.article'] | order(_updatedAt desc) [0..2] {
		${newsArticle}
	}
`);

/** IMPORTANT: The params `lastId` and `lastUpdatedAt` are required */
export const newsArticlesPaginatedQuery = defineQuery(`
	*[_type == 'news.article' && (
			_updatedAt > $lastUpdatedAt
			|| (_updatedAt == $lastUpdatedAt && _id > $lastId)
		)] | order(_updatedAt desc) [3..8] {
		${newsArticle}
	}
`);
