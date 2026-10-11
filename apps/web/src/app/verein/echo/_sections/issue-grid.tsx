import Image from 'next/image';
import Link from 'next/link';

import { OverviewPagination } from '@/components/ui/pagination';
import type { EchoIssuesQueryResult } from '@/types/sanity.types';
import { ECHO_OVERVIEW_PATH, getEchoIssuePath } from '@/utils/links';

import { getCoverUrl, getIssueYear } from '../_shared/utils';

const COVER_WIDTH = 600;

/**
 * One issue in the grid: its cover, title and year, all of it a link to the issue.
 *
 * @param props - The card's props.
 * @param props.issue - The issue.
 * @returns The card.
 */
function IssueCard({ issue }: Readonly<{ issue: EchoIssue }>) {
	const cover = getCoverUrl(issue.cover, COVER_WIDTH, issue.indexable);

	return (
		<Link className="group flex flex-col gap-3" href={getEchoIssuePath(issue.slug)}>
			<div className="relative aspect-[1/1.414] overflow-hidden rounded-xl bg-background">
				{/* The optimizer would serve a hidden issue's cover without the noindex header. */}
				{cover && (
					<Image
						alt={`Titelseite von ${issue.title}`}
						className="object-cover duration-500 group-hover:scale-105"
						fill
						sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
						src={cover}
						unoptimized={!issue.indexable}
					/>
				)}
			</div>
			<h3 className="text-lg font-bold md:text-xl">{issue.title}</h3>
			<p className="text-sm md:text-base">{getIssueYear(issue.releaseDate)}</p>
		</Link>
	);
}

/**
 * Every issue but the newest, as covers in a grid, with the archive's pagination.
 *
 * @param props - The grid's props.
 * @param props.currentPage - The page of the archive, from 1.
 * @param props.issues - The issues of this page.
 * @param props.perPage - The issues per page.
 * @param props.startIndex - The index of the first issue in the grid; the newest one sits above it.
 * @param props.totalIssues - The number of finished issues, the newest one included.
 * @returns The grid.
 */
function IssueGrid({
	currentPage,
	issues,
	perPage,
	startIndex,
	totalIssues,
}: Readonly<IssueGridProps>) {
	return (
		<section className="mt-10 md:mt-28">
			<h2 className="pb-8 text-xl md:pb-14 md:text-4xl">Alle Ausgaben</h2>
			<ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-10">
				{issues.map((issue) => (
					<li key={issue._id}>
						<IssueCard issue={issue} />
					</li>
				))}
			</ul>

			<OverviewPagination
				basePath={ECHO_OVERVIEW_PATH}
				className="mt-8 lg:mt-14"
				currentPage={currentPage}
				itemLabel="Ausgaben"
				perPage={perPage}
				startIndex={startIndex}
				totalItems={totalIssues}
			/>
		</section>
	);
}

type EchoIssue = EchoIssuesQueryResult[number];

interface IssueGridProps {
	currentPage: number;
	issues: EchoIssuesQueryResult;
	perPage: number;
	startIndex: number;
	totalIssues: number;
}

export { IssueGrid };
