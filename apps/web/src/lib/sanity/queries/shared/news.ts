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
 * so the category combobox can preselect it. The articles of each category are counted once, in the
 * projection, and the filter after it reads that count.
 *
 * **IMPORTANT:** The param `current` is required: the slug of the category page, or an empty string
 * on the overview.
 */
const newsCategoriesQuery = defineQuery(`{
	"categories": *[_type == 'news.category'] {
		"articleCount": count(*[_type == 'news.article' && references(^._id)]),
		"slug": slug.current,
		title,
	}[slug == $current || articleCount > 0] | order(title asc),
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

/**
 * Query to find the current slug of a news category that used to have another one
 *
 * The perspective decides which versions are candidates, as for the departments (see
 * `departmentRedirectQuery`). Two categories may list the same former slug, so the most recently
 * updated one wins and the id breaks a tie, which makes every request answer the same.
 *
 * @param slug - The slug that no category uses any more
 * @returns The current slug of the category that used to have it, or `null` when none did
 */
const newsCategoryRedirectQuery = defineQuery(`
	*[
		_type == 'news.category' &&
		$slug in previousSlugs &&
		defined(slug.current) &&
		!(_id in path('drafts.**'))
	] | order(_updatedAt desc, _id asc)[0].slug.current
`);

export {
	newsArticle,
	newsArticlesQuery,
	newsArticlesPaginatedQuery,
	newsArticlesTotalQuery,
	newsCategoriesQuery,
	newsCategoryQuery,
	newsCategoryRedirectQuery,
};
