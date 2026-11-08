import type { BreadcrumbList, WithContext } from 'schema-dts';

import { capitalizeWords } from './typography';

interface BreadcrumbItem {
	name: string;
	path: string;
}

/**
 * The names the server knows for the pages on a breadcrumb trail.
 *
 * A slug cannot carry the name of its page: `fussball` is "Fußball", `pr-team` is "PR-Team". So the
 * page passes the titles of its documents, and a name that is missing or empty leaves its item to
 * the humanised segment.
 */
interface BreadcrumbNames {
	/** The title of the page itself, which names the last item. */
	page?: string | null;
	/** The titles of the pages above it, by their path (`/angebot/fussball`). */
	parents?: Readonly<Record<string, string | null | undefined>>;
}

/** Segments that only group pages and have no page of their own, so the trail leaves them out. */
const SKIPPED_SEGMENTS = new Set(['anmeldung']);

/** Segments the club writes differently from their humanised slug. */
const SEGMENT_NAMES: Record<string, string> = { echo: 'TSG-Echo' };

/**
 * Picks the name of an item, skipping the candidates that are missing or empty.
 *
 * @param fallback - The name when no candidate has text.
 * @param candidates - The names to try first, in the order they take precedence.
 * @returns The first candidate with text, or the fallback.
 */
function pickName(fallback: string, ...candidates: (string | null | undefined)[]): string {
	return candidates.find((name): name is string => Boolean(name?.trim())) ?? fallback;
}

/**
 * Derives the breadcrumb trail of a page from its path.
 *
 * The trail starts at the home page and has one item per path segment, each pointing at the path up
 * to that segment. An item takes the name the page passes for it, and the last one is the page
 * itself. Without a name the segment is humanised (`weitere-sportarten` becomes "Weitere
 * Sportarten"). A segment that has no page of its own (`/anmeldung`) is left out of the trail.
 *
 * @param pathname - The path of the page.
 * @param names - The titles of the page and the pages above it.
 * @returns The trail, from the home page down to the page.
 */
function getBreadcrumbItems(pathname: string, names: BreadcrumbNames = {}): BreadcrumbItem[] {
	const segments = pathname.split('/').filter(Boolean);
	const items = segments.flatMap((segment, index) => {
		if (SKIPPED_SEGMENTS.has(segment)) {
			return [];
		}

		const path = `/${segments.slice(0, index + 1).join('/')}`;
		const isPage = index === segments.length - 1;

		return {
			name: pickName(
				capitalizeWords(segment),
				isPage ? names.page : names.parents?.[path],
				SEGMENT_NAMES[segment],
			),
			path,
		};
	});

	return [{ name: 'Home', path: '/' }, ...items];
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

export type { BreadcrumbItem, BreadcrumbNames };
export { getBreadcrumbItems, getBreadcrumbListSchema };
