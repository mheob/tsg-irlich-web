import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

import { newsArticle } from '../shared/news';

/**
 * Query to get the news overview category page
 *
 * @returns The news overview category page
 */
export const newsOverviewCategoryPageQuery = defineQuery(`
	*[_type == 'newsOverviewCategory'][0] {
		...,
		content {
			contactPersonsSection {
				...,
				contactPersons[]-> {
					${contactPersons}
				}
			}
		}
	}
`);

/**
 * Query to get the news articles for a given category
 *
 * @param category - The category to get the news articles for
 * @param start - The start index
 * @param end - The end index
 * @returns An array of news articles
 */
export const newsArticlesPaginatedForCategoryQuery = defineQuery(`
	*[_type == 'news.article' && $category in categories[]->slug.current]
	| order(publishedAt desc) [$start..$end] {
		${newsArticle}
	}
`);

/**
 * Query to get the total number of news articles for a given category
 *
 * @param category - The category to get the total number of news articles for
 * @returns The total number of news articles
 */
export const newsArticlesTotalForCategoryQuery = defineQuery(`
	count(*[_type == "news.article" && $category in categories[]->slug.current])
`);
