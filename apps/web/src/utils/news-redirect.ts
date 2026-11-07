import type { NewsArticleRedirectQueryResult } from '@/types/sanity.types';

import { getInternalHref } from './links';
import { getPaginatedPath } from './pagination';

/**
 * Picks the address a former article slug redirects to: the article under its first category,
 * where every link points.
 *
 * @param match - The article `newsArticleRedirectQuery` found, or `null` when it found none.
 * @returns The current path of the article, or `undefined` when it has none.
 */
function resolveNewsArticleRedirect(match: NewsArticleRedirectQueryResult): string | undefined {
	if (!match?.category || !match.slug) {
		return undefined;
	}

	return getInternalHref({ _type: 'news.article', category: match.category, slug: match.slug });
}

/**
 * Picks the address a former category slug redirects to. A later page stays the same page, under
 * its public address (`?seite=N`), never under the internal route it was rendered from.
 *
 * @param currentSlug - The slug `newsCategoryRedirectQuery` found, or `null` when it found none.
 * @param currentPage - The page that was asked for, from 1.
 * @returns The current path of the page, or `undefined` when no category used the slug.
 */
function resolveNewsCategoryRedirect(
	currentSlug: string | null,
	currentPage: number,
): string | undefined {
	if (!currentSlug) {
		return undefined;
	}

	return getPaginatedPath(`/news/${currentSlug}`, currentPage);
}

export { resolveNewsArticleRedirect, resolveNewsCategoryRedirect };
