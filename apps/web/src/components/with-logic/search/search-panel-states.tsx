import Link from 'next/link';
import type { ReactNode } from 'react';

import { getSearchPath } from '@/lib/search/path';
import type { PopularSearches } from '@/lib/search/popular';

/** The pill a popular search is drawn as. */
const CHIP_CLASS_NAME =
	'inline-flex items-center rounded-full border-2 border-primary px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none';

const LINK_CLASS_NAME =
	'text-sm font-semibold text-primary-light underline underline-offset-4 hover:text-primary focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:text-base';

/**
 * „Häufig gesucht“ in the panel: terms that open the search page with one click. The panel shows
 * them while the input holds nothing to search for.
 *
 * @param props - The list's props.
 * @param props.onNavigate - Called when a term is followed, to close the panel.
 * @param props.popularSearches - The heading and the terms.
 * @returns The list, or nothing without a term, so no heading stands over an empty list.
 */
function SearchPanelPopular({ onNavigate, popularSearches }: Readonly<SearchPanelPopularProps>) {
	const { terms, title } = popularSearches;

	if (terms.length === 0) {
		return null;
	}

	return (
		<div>
			{/* The dialog's own title is the `h2`. */}
			<h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
				{title}
			</h3>
			<ul className="mt-3 flex flex-wrap gap-2">
				{terms.map((term) => (
					<li key={term}>
						<Link className={CHIP_CLASS_NAME} href={getSearchPath(term)} onClick={onNavigate}>
							{term}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}

/**
 * A message in place of the hits, when nothing was found or the search failed, with a link to the
 * search page for the term. The page has more to offer there: its own empty state, or a second
 * try.
 *
 * @param props - The notice's props.
 * @param props.children - The message.
 * @param props.onNavigate - Called when the link is followed, to close the panel.
 * @param props.query - The search term the link takes along.
 * @returns The message and the link.
 */
function SearchPanelNotice({ children, onNavigate, query }: Readonly<SearchPanelNoticeProps>) {
	return (
		<div className="flex flex-col items-start gap-3">
			<p className="text-base text-foreground md:text-lg">{children}</p>
			<Link className={LINK_CLASS_NAME} href={getSearchPath(query)} onClick={onNavigate}>
				Zur Suchseite
			</Link>
		</div>
	);
}

interface SearchPanelPopularProps {
	onNavigate: () => void;
	popularSearches: PopularSearches;
}

interface SearchPanelNoticeProps {
	children: ReactNode;
	onNavigate: () => void;
	query: string;
}

export { SearchPanelNotice, SearchPanelPopular };
