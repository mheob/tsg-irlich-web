import Link from 'next/link';

import { getSearchPath } from '@/lib/search/path';
import type { SearchResult, SearchTab } from '@/lib/search/types';

const TABS: readonly { id: SearchTab; label: string }[] = [
	{ id: 'alle', label: 'Alle' },
	{ id: 'seiten', label: 'Seiten' },
	{ id: 'news', label: 'News' },
];

/**
 * The tabs of the search page: „Alle“, „Seiten“ and „News“, each with its number of hits. They are
 * links, so they work without JavaScript, and the current one carries `aria-current="page"`. Every
 * link keeps the search term and drops the page number, since a tab starts on its first page.
 *
 * @param props - The tabs' props.
 * @param props.query - The search term.
 * @param props.tab - The current tab.
 * @param props.totals - The hits of both groups.
 * @returns The tab navigation.
 */
function SearchTabs({ query, tab, totals }: Readonly<SearchTabsProps>) {
	const counts: Record<SearchTab, number> = {
		alle: totals.pages + totals.news,
		news: totals.news,
		seiten: totals.pages,
	};

	return (
		<nav aria-label="Trefferart" className="mt-6 border-b border-border">
			<ul className="flex gap-1.5">
				{TABS.map(({ id, label }) => (
					<li key={id}>
						<Link
							aria-current={id === tab ? 'page' : undefined}
							className="group -mb-px inline-flex items-center gap-2 border-b-[3px] border-transparent px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary aria-[current=page]:border-secondary aria-[current=page]:text-primary motion-reduce:transition-none md:text-base"
							href={getSearchPath(query, id)}
						>
							{/* The space keeps the accessible name "Alle 30" apart; the flex container drops it visually. */}
							{label}{' '}
							<span className="rounded-full bg-background-high-contrast px-2 py-px text-xs group-aria-[current=page]:bg-primary group-aria-[current=page]:text-primary-foreground">
								{counts[id]}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}

interface SearchTabsProps {
	query: string;
	tab: SearchTab;
	totals: SearchResult['totals'];
}

export { SearchTabs };
