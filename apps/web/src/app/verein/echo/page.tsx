import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { PortableText } from '@/components/ui/portable-text';
import { client } from '@/lib/sanity/client';
import {
	echoIssuesQuery,
	echoIssuesTotalQuery,
	echoOverviewPageQuery,
} from '@/lib/sanity/queries/pages/echo';
import type {
	EchoIssuesQueryResult,
	EchoIssuesTotalQueryResult,
	EchoOverviewPageQueryResult,
} from '@/types/sanity.types';
import { ECHO_OVERVIEW_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';
import { getPageNumber, getPaginatedPath } from '@/utils/pagination';

import { IssueGrid } from './_sections/issue-grid';
import { LatestIssue } from './_sections/latest-issue';
import { ECHO_HERO_IMAGE } from './_shared/hero';

/** The newest issue has its own card; the grid starts with the second one. */
const START_INDEX = 1;
const ITEMS_PER_PAGE = 12;

export async function generateMetadata({
	searchParams,
}: Readonly<PageProps<'/verein/echo'>>): Promise<Metadata> {
	const [page, { seite }] = await Promise.all([
		client.fetch<EchoOverviewPageQueryResult>(echoOverviewPageQuery),
		searchParams,
	]);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		meta: page.meta,
		path: getPaginatedPath(ECHO_OVERVIEW_PATH, getPageNumber(seite)),
		title: page.title,
	});
}

export default async function EchoOverviewPage({
	searchParams,
}: Readonly<PageProps<'/verein/echo'>>) {
	const { seite } = await searchParams;
	const currentPage = getPageNumber(seite);
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;

	const [page, total, [latest], issues] = await Promise.all([
		client.fetch<EchoOverviewPageQueryResult>(echoOverviewPageQuery),
		client.fetch<EchoIssuesTotalQueryResult>(echoIssuesTotalQuery),
		client.fetch<EchoIssuesQueryResult>(echoIssuesQuery, { end: START_INDEX, start: 0 }),
		client.fetch<EchoIssuesQueryResult>(echoIssuesQuery, { end: start + ITEMS_PER_PAGE, start }),
	]);

	if (!page) {
		notFound();
	}

	if (currentPage > 1 && start >= total) {
		notFound();
	}

	return (
		<>
			<Hero image={ECHO_HERO_IMAGE} subTitle={page.subtitle} title={page.title} />

			<section className="container mx-auto py-10 md:py-28">
				{page.intro && (
					<div className="mx-auto prose max-w-3xl md:prose-xl">
						<PortableText value={page.intro} />
					</div>
				)}

				{latest ? (
					<LatestIssue issue={latest} />
				) : (
					<p className="mt-10 text-center">Noch keine Ausgaben online.</p>
				)}

				{issues.length > 0 && (
					<IssueGrid
						currentPage={currentPage}
						hasNextPage={start + ITEMS_PER_PAGE < total}
						issues={issues}
					/>
				)}
			</section>

			<Newsletter />
		</>
	);
}
