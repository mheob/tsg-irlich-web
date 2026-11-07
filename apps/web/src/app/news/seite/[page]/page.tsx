import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getLaterPageNumber } from '@/utils/pagination';

import { NewsOverview } from '../../_shared/news-overview';
import { getNewsOverviewMetadata } from '../../_shared/news-overview-metadata';

/*
 * The later pages of the news overview. Their address is `/news?seite=N`, which `next.config.ts`
 * rewrites to this route; a request for this path itself is redirected there.
 */

/**
 * Prerenders no page at build time. The empty list makes the route static: a page is rendered on its
 * first request and cached until the revalidation webhook expires it.
 *
 * @returns No params.
 */
export function generateStaticParams(): { page: string }[] {
	return [];
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/news/seite/[page]'>>): Promise<Metadata> {
	const { page } = await params;
	const pageNumber = getLaterPageNumber(page);
	if (!pageNumber) {
		notFound();
	}

	return getNewsOverviewMetadata(pageNumber);
}

export default async function NewsOverviewLaterPage({
	params,
}: Readonly<PageProps<'/news/seite/[page]'>>) {
	const { page } = await params;
	const pageNumber = getLaterPageNumber(page);
	if (!pageNumber) {
		notFound();
	}

	return <NewsOverview currentPage={pageNumber} />;
}
