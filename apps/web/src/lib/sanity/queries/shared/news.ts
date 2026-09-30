import { defineQuery } from 'next-sanity';

import { featuredImage, meta } from '@/lib/sanity/queries';

const newsArticle = /* groq */ `
	_id,
	publishedAt,
	author->{ firstName, lastName, image },
	categories[]->{ title, "slug": slug.current },
	excerpt,
	meta { metaTitle, metaDescription, openGraphImage},
	${featuredImage},
	"slug": slug.current,
	title,
`;

const newsArticlesQuery = defineQuery(`
	*[_type == 'news.article'] | order(publishedAt desc) [0..2] {
		${newsArticle}
	}
`);

/** **IMPORTANT:** The params `start` and `end` are required */
const newsArticlesPaginatedQuery = defineQuery(`
	*[_type == 'news.article'] | order(publishedAt desc) [$start..$end] { // $start = 3, $end = 8
		${newsArticle}
	}
`);

const newsArticlesTotalQuery = defineQuery(`count(*[_type == "news.article"])`);

/**
 * Every category that holds at least one article, plus the one being shown even when it is empty,
 * so the category combobox can preselect it.
 *
 * **IMPORTANT:** The param `current` is required: the slug of the category page, or an empty string
 * on the overview.
 */
const newsCategoriesQuery = defineQuery(`{
	"categories": *[
		_type == 'news.category'
		&& (slug.current == $current || count(*[_type == 'news.article' && references(^._id)]) > 0)
	] | order(title asc) {
		"articleCount": count(*[_type == 'news.article' && references(^._id)]),
		"slug": slug.current,
		title,
	},
	"total": count(*[_type == 'news.article'])
}`);

/** **IMPORTANT:** The params `slug` is required */
const newsCategoryQuery = defineQuery(`
	*[_type == 'news.category' && slug.current == $slug][0] {
		"slug": slug.current,
		title,
		${meta}
	}
`);

export {
	newsArticle,
	newsArticlesQuery,
	newsArticlesPaginatedQuery,
	newsArticlesTotalQuery,
	newsCategoriesQuery,
	newsCategoryQuery,
};
