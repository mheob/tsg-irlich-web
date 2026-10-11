import { cn } from '@tsgi-web/shared';

import { getPageCount, getPaginatedPath, getPaginationRange } from '@/utils/pagination';

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from './pagination';

/**
 * The page links of a paginated overview, with the range of items the page shows above them.
 *
 * Every link points at the canonical path of its page, so the first page goes without `?seite=`.
 * The scroll position stays where it is when paging, as it did with the arrows before.
 *
 * @param props - The pagination's props.
 * @param props.basePath - The path of the overview.
 * @param props.className - Classes for the wrapper.
 * @param props.currentPage - The page shown, from 1.
 * @param props.itemLabel - What the items are called in the range line ("Artikel", "Ausgaben").
 * @param props.perPage - The items per page.
 * @param props.startIndex - The index of the first paginated item.
 * @param props.totalItems - The number of items, including those before the start index.
 * @returns The pagination, or nothing when every item fits on one page.
 */
function OverviewPagination({
	basePath,
	className,
	currentPage,
	itemLabel,
	perPage,
	startIndex,
	totalItems,
}: Readonly<OverviewPaginationProps>) {
	const pageCount = getPageCount({ perPage, startIndex, total: totalItems });
	if (pageCount <= 1) {
		return null;
	}

	const firstItem = startIndex + (currentPage - 1) * perPage + 1;
	const lastItem = Math.min(firstItem + perPage - 1, totalItems);
	const previousHref = currentPage > 1 ? getPaginatedPath(basePath, currentPage - 1) : undefined;
	const nextHref =
		currentPage < pageCount ? getPaginatedPath(basePath, currentPage + 1) : undefined;

	return (
		<div className={cn('flex flex-col items-center gap-4', className)}>
			<p className="text-sm text-muted-foreground md:text-base">
				{`${itemLabel} ${firstItem}–${lastItem} von ${totalItems}`}
			</p>
			<Pagination>
				<PaginationContent>
					{/* An arrow without a target only holds its place; its item stays out of the list. */}
					<PaginationItem aria-hidden={previousHref === undefined || undefined}>
						<PaginationPrevious href={previousHref} scroll={false} />
					</PaginationItem>
					{getPaginationRange(currentPage, pageCount).map((slot) =>
						typeof slot === 'number' ? (
							<PaginationItem key={slot}>
								<PaginationLink
									aria-label={`Seite ${slot}`}
									href={getPaginatedPath(basePath, slot)}
									isActive={slot === currentPage}
									scroll={false}
								>
									{slot}
								</PaginationLink>
							</PaginationItem>
						) : (
							<PaginationItem aria-hidden key={slot}>
								<PaginationEllipsis />
							</PaginationItem>
						),
					)}
					<PaginationItem aria-hidden={nextHref === undefined || undefined}>
						<PaginationNext href={nextHref} scroll={false} />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}

interface OverviewPaginationProps {
	basePath: string;
	className?: string;
	currentPage: number;
	itemLabel: string;
	perPage: number;
	startIndex: number;
	totalItems: number;
}

export { OverviewPagination };
