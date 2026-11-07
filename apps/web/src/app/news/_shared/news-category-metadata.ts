import type { Metadata } from 'next';

import { sanityFetch } from '@/lib/sanity/live';
import { newsOverviewHeroImageQuery } from '@/lib/sanity/queries/pages/news-overview';
import { newsCategoryQuery } from '@/lib/sanity/queries/shared/news';
import { getPageMetadata } from '@/utils/metadata';
import { getPaginatedPath } from '@/utils/pagination';

/**
 * Builds the metadata of a page of a news category. `/news/[category]` is the first page, and
 * `/news/[category]/seite/[page]` serves the later ones, which are addressed as
 * `/news/<category>?seite=N`.
 *
 * @param categoryParameter - The category segment of the request.
 * @param currentPage - The page shown, from 1.
 * @returns The metadata, empty for an unknown category.
 */
async function getNewsCategoryMetadata(
	categoryParameter: string,
	currentPage: number,
): Promise<Metadata> {
	const [{ data: category }, { data: heroImage }] = await Promise.all([
		sanityFetch({ params: { slug: categoryParameter }, query: newsCategoryQuery, stega: false }),
		sanityFetch({ query: newsOverviewHeroImageQuery, stega: false }),
	]);
	if (!category) {
		return {};
	}

	return getPageMetadata({
		image: heroImage,
		meta: category.meta,
		path: getPaginatedPath(`/news/${category.slug}`, currentPage),
		title: category.title,
	});
}

export { getNewsCategoryMetadata };
