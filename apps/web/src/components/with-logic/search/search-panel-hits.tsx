import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';

import { SearchHitRow } from '@/components/ui/search';
import { getSearchPath } from '@/lib/search/path';
import type { SearchHit, SearchResult, SearchTab } from '@/lib/search/types';

/** The two groups of the panel, in the order they are shown and stepped through. */
const HIT_GROUPS = [
	{ key: 'pages', label: 'Seiten', tab: 'seiten' },
	{ key: 'news', label: 'News', tab: 'news' },
] as const satisfies readonly HitGroup[];

/**
 * The hits of the panel: one listbox with a group „Seiten“ and a group „News“, side by side from
 * `lg` and stacked below. A group without a hit is left out, so no group stands empty in the
 * listbox. Each option is the title link of its row, so a click follows it like any link.
 *
 * Below the listbox, and outside of it, a group that shows only some of its hits links to all of
 * them on the search page. From `lg` each link stands under its own group.
 *
 * @param props - The hits' props.
 * @param props.activeId - The id of the option the arrow keys have marked, `null` for none.
 * @param props.getOptionId - Builds the id of a hit's option, the one `aria-activedescendant` names.
 * @param props.listboxId - The id of the listbox, for the input's `aria-controls`.
 * @param props.onNavigate - Called when a link is followed, to close the panel.
 * @param props.result - The result, with at least one hit.
 * @returns The listbox and the links to the search page.
 */
function SearchPanelHits({
	activeId,
	getOptionId,
	listboxId,
	onNavigate,
	result,
}: Readonly<SearchPanelHitsProps>) {
	const labelId = useId();
	const groups = HIT_GROUPS.flatMap(({ key, label, tab }) => {
		const hits = result[key];
		return hits.length > 0 ? [{ hits, label, tab, total: result.totals[key] }] : [];
	});
	const hasMoreLinks = groups.some((group) => group.total > group.hits.length);

	return (
		<div className="flex flex-col gap-4">
			<div
				aria-label="Treffer"
				className="grid gap-6 lg:grid-cols-2 lg:gap-10"
				id={listboxId}
				// The pattern needs the focus to stay in the input, which a native `select` cannot do.
				// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
				role="listbox"
			>
				{groups.map((group) => (
					<div
						aria-labelledby={`${labelId}-${group.tab}`}
						className="flex flex-col gap-1"
						key={group.tab}
						// A `fieldset` is a form group and no group of a listbox.
						// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
						role="group"
					>
						<div
							className="px-1.5 pb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
							id={`${labelId}-${group.tab}`}
						>
							{group.label}
						</div>
						{group.hits.map((hit) => {
							const optionId = getOptionId(hit);

							return (
								<SearchHitRow
									hit={hit}
									key={hit.id}
									linkProps={{
										'aria-selected': optionId === activeId,
										id: optionId,
										onClick: onNavigate,
										role: 'option',
										tabIndex: -1,
									}}
									words={result.words}
									compact
								/>
							);
						})}
					</div>
				))}
			</div>

			{hasMoreLinks && (
				<div className="grid gap-2 lg:grid-cols-2 lg:gap-10">
					{groups.map((group) =>
						group.total > group.hits.length ? (
							<Link
								className="inline-flex items-center gap-1.5 self-start px-1.5 text-sm font-semibold text-primary-light underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								href={getSearchPath(result.query, group.tab)}
								key={group.tab}
								onClick={onNavigate}
							>
								{`Alle ${group.total} ${group.label} anzeigen`}
								<ArrowRight aria-hidden="true" className="size-4" />
							</Link>
						) : (
							// Keeps the link of the other group in its own column.
							<div key={group.tab} />
						),
					)}
				</div>
			)}
		</div>
	);
}

interface HitGroup {
	key: 'news' | 'pages';
	label: string;
	tab: Exclude<SearchTab, 'alle'>;
}

interface SearchPanelHitsProps {
	activeId: null | string;
	getOptionId: (hit: SearchHit) => string;
	listboxId: string;
	onNavigate: () => void;
	result: SearchResult;
}

export { SearchPanelHits };
