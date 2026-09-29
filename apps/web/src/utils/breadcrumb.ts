import type { BreadcrumbList, WithContext } from 'schema-dts';

import { capitalizeWords } from './typography';

interface BreadcrumbItem {
	name: string;
	path: string;
}

/**
 * Derives the breadcrumb trail of a page from its path.
 *
 * The trail starts at the home page and has one item per path segment, each pointing at the path up
 * to that segment. The segments are humanised for their names (`weitere-sportarten` becomes
 * "Weitere Sportarten"), except the last one, which is the page itself and takes its title.
 *
 * @param pathname - The path of the page.
 * @param currentPage - The title of the page, used as the name of the last item.
 * @returns The trail, from the home page down to the page.
 */
function getBreadcrumbItems(pathname: string, currentPage?: string): BreadcrumbItem[] {
	const segments = pathname.split('/').filter(Boolean);
	const items = segments.map((segment, index) => ({
		name: capitalizeWords(segment),
		path: `/${segments.slice(0, index + 1).join('/')}`,
	}));
	const page = items.pop();

	return [
		{ name: 'Home', path: '/' },
		...items,
		...(page ? [{ name: currentPage ?? page.name, path: page.path }] : []),
	];
}

/**
 * Describes a breadcrumb trail.
 *
 * @param baseUrl - The site's base URL.
 * @param items - The trail, from the home page down to the current page.
 * @returns The `BreadcrumbList` node.
 */
function getBreadcrumbListSchema(
	baseUrl: string,
	items: readonly BreadcrumbItem[],
): WithContext<BreadcrumbList> {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			item: `${baseUrl}${item.path}`,
			name: item.name,
			// schema.org counts from 1.
			position: index + 1,
		})),
	};
}

export type { BreadcrumbItem };
export { getBreadcrumbItems, getBreadcrumbListSchema };
