import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { OverviewPagination } from '@/components/ui/pagination';
import { SearchHitCard, SearchHitRow } from '@/components/ui/search';
import { HITS_PER_PAGE } from '@/lib/search/constants';
import { getSearchPath } from '@/lib/search/path';
import type { SearchResult, SearchTab } from '@/lib/search/types';

// A group of hits: its heading with the number of hits next to it, then the hits.
function ResultGroup({ children, count, title }: Readonly<ResultGroupProps>) {
	return (
		<section className="mt-8 md:mt-12">
			<div className="mb-4 flex items-baseline gap-3 md:mb-6">
				<h2 className="text-xl md:text-3xl">{title}</h2>
				<p className="text-sm text-muted-foreground">{`${count} Treffer`}</p>
			</div>
			{children}
		</section>
	);
}

// The link under a group of „Alle“ that opens the tab with all of its hits.
function MoreLink({ href, label }: Readonly<MoreLinkProps>) {
	return (
		<Link
			className="mt-4 inline-flex items-center gap-2 font-semibold text-primary-light hover:text-primary md:text-lg"
			href={href}
		>
			{label}
			<ArrowRight aria-hidden="true" className="size-4 md:size-5" />
		</Link>
	);
}

/**
 * The hits of the search page, as the tab shows them:
 *
 * - „Alle“ shows a few page hits as cards and a few news hits as rows, each group with a link to
 *   its own tab when there are more.
 * - „Seiten“ and „News“ show their group alone, ten hits to a page, with the pagination below.
 *
 * Each group has its heading at `h2`, so the `h3` of every hit sits directly under it.
 *
 * @param props - The results' props.
 * @param props.currentPage - The page of the „Seiten“ or „News“ tab, from 1. „Alle“ has one page.
 * @param props.result - The result of the search.
 * @param props.tab - The current tab.
 * @returns The groups of hits.
 */
function SearchResults({ currentPage, result, tab }: Readonly<SearchResultsProps>) {
	const { news, pages, query, totals, words } = result;
	const isAll = tab === 'alle';
	// „Alle“ leaves out a group without a hit; a tab of its own shows its heading with 0 hits.
	const hasPages = tab === 'seiten' || (isAll && pages.length > 0);
	const hasNews = tab === 'news' || (isAll && news.length > 0);

	const pagination = isAll ? null : (
		<OverviewPagination
			basePath={getSearchPath(query, tab)}
			className="mt-8 md:mt-12"
			currentPage={currentPage}
			itemLabel="Treffer"
			perPage={HITS_PER_PAGE}
			startIndex={0}
			totalItems={tab === 'seiten' ? totals.pages : totals.news}
		/>
	);

	return (
		<>
			{hasPages && (
				<ResultGroup count={totals.pages} title="Seiten">
					<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{pages.map((hit) => (
							<li className="grid" key={hit.id}>
								<SearchHitCard hit={hit} words={words} />
							</li>
						))}
					</ul>
					{isAll && totals.pages > pages.length && (
						<MoreLink
							href={getSearchPath(query, 'seiten')}
							label={`Alle ${totals.pages} Seiten-Treffer anzeigen`}
						/>
					)}
					{tab === 'seiten' && pagination}
				</ResultGroup>
			)}

			{hasNews && (
				<ResultGroup count={totals.news} title="News">
					<ul className="divide-y divide-border/60">
						{news.map((hit) => (
							<li key={hit.id}>
								<SearchHitRow hit={hit} words={words} />
							</li>
						))}
					</ul>
					{isAll && totals.news > news.length && (
						<MoreLink
							href={getSearchPath(query, 'news')}
							label={`Alle ${totals.news} News-Treffer anzeigen`}
						/>
					)}
					{tab === 'news' && pagination}
				</ResultGroup>
			)}
		</>
	);
}

interface SearchResultsProps {
	currentPage: number;
	result: SearchResult;
	tab: SearchTab;
}

interface ResultGroupProps {
	children: ReactNode;
	count: number;
	title: string;
}

interface MoreLinkProps {
	href: string;
	label: string;
}

export { SearchResults };
