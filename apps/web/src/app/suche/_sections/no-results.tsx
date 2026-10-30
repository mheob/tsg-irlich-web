import { PortableText } from '@/components/ui/portable-text';
import { NavigationAnchor } from '@/components/with-logic/navigation/navigation-anchor';
import { getNavigationEntries } from '@/components/with-logic/navigation/navigation-entries';
import type { NavigationLink } from '@/components/with-logic/navigation/navigation-entries';
import { SEARCH_PATH } from '@/lib/search/path';
import type { SearchPageQueryResult } from '@/types/sanity.types';

import { CHIP_CLASS_NAME } from '../_shared/chip-class-name';

type NoResultsContent = NonNullable<SearchPageQueryResult>['content']['noResults'];

/**
 * Resolves the links of the editors the way the main navigation resolves its own: an internal link
 * through `getInternalHref`, an external one through its `href`, and one without a title or a target
 * is left out.
 *
 * @param links - `noResults.links` of the search page.
 * @returns The links that can be rendered, in the order of the editors.
 */
function resolveLinks(links: NoResultsContent['links']): NavigationLink[] {
	const entries = getNavigationEntries(
		links.map((link) => ({ ...link, _type: 'navigationLink', children: [] })),
		SEARCH_PATH,
	);

	return entries.flatMap((entry) => (entry.kind === 'link' ? [entry.link] : []));
}

/**
 * The empty state of a search that found nothing: the heading, text and links the editors wrote.
 * While the search page singleton is missing there is nothing of theirs, and the heading names the
 * search term instead.
 *
 * @param props - The empty state's props.
 * @param props.content - `noResults` of the search page, `undefined` while the singleton or the
 * section is missing. Any part of it can be missing, and a missing title falls back like the whole
 * section does.
 * @param props.query - The search term, for the heading while there is no title.
 * @returns The empty state.
 */
function NoResults({ content, query }: Readonly<NoResultsProps>) {
	const title = content?.title?.trim();
	const heading = title === undefined || title === '' ? `Keine Treffer für „${query}“` : title;
	const links = resolveLinks(content?.links ?? []);

	return (
		<section className="mt-10 rounded-xl bg-background-low-contrast p-6 md:mt-16 md:p-10">
			<h2 className="text-xl md:text-3xl">{heading}</h2>

			{content?.text?.text && content.text.text.length > 0 && (
				<div className="mt-3 max-w-3xl md:mt-4 md:text-lg">
					<PortableText value={content.text.text} />
				</div>
			)}

			{links.length > 0 && (
				<ul className="mt-6 flex flex-wrap gap-2">
					{links.map((link) => (
						<li key={link.key}>
							<NavigationAnchor className={CHIP_CLASS_NAME} link={link} />
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

interface NoResultsProps {
	content?: Partial<NoResultsContent>;
	query: string;
}

export { NoResults };
export type { NoResultsContent };
