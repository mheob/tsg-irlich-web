import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

import { newsArticle } from '../shared/news';

export const newsOverviewCategoryPageQuery = defineQuery(`
	*[_type == 'newsOverviewCategory'][0] {
		...,
		content {
			contactPersonsSection {
				intro,
				subtitle,
				title,
			}
		}
	}
`);

export const newsOverviewContactPersonsCategoryQuery = defineQuery(`
	*[_type == 'newsOverviewCategory'][0].content.contactPersonsSection.contactPersons[]-> {
		${contactPersons}
	}
`);

/** **IMPORTANT:** The params `category` and `start` and `end` are required */
export const newsArticlesPaginatedForCategoryQuery = defineQuery(`
	*[_type == 'news.article' && $category in categories[]->slug.current]
	| order(publishedAt desc) [$start..$end] {
		${newsArticle}
	}
`);

export const newsArticlesTotalForCategoryQuery = defineQuery(`
	count(*[_type == "news.article" && $category in categories[]->slug.current])
`);
