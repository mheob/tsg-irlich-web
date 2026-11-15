import type { NewsCategoriesQueryResult } from '@/types/sanity.types';

const OVERVIEW_HREF = '/news';

/** `label` and `value` are the names Base UI reads an item's display text and identity from. */
export interface CategoryOption {
	count: number;
	label: string;
	value: string;
}

/**
 * The choices of the category combobox: all news first, then every category with its page.
 *
 * @param categories - The categories with at least one article.
 * @param total - The number of all articles.
 * @returns The options in the order of the list.
 */
export function getCategoryOptions(
	categories: NewsCategoriesQueryResult['categories'],
	total: NewsCategoriesQueryResult['total'],
): CategoryOption[] {
	return [
		{ count: total, label: 'Alle News', value: OVERVIEW_HREF },
		...categories.map(({ articleCount, slug, title }) => ({
			count: articleCount,
			label: title,
			value: `${OVERVIEW_HREF}/${slug}`,
		})),
	];
}

/**
 * The page the combobox stands on.
 *
 * @param currentSlug - The slug of the category page; the overview passes none.
 * @returns The `value` of the option that is selected there.
 */
export function getCurrentHref(currentSlug: string | undefined): string {
	return currentSlug ? `${OVERVIEW_HREF}/${currentSlug}` : OVERVIEW_HREF;
}
