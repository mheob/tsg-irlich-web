import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getLaterPageNumber } from '@/utils/pagination';

import { EchoArchive } from '../../_shared/echo-archive';
import { getEchoArchiveMetadata } from '../../_shared/echo-archive-metadata';

/*
 * The later pages of the archive. Their address is `/verein/echo?seite=N`, which `next.config.ts`
 * rewrites to this route; a request for this path itself is redirected there.
 */

/**
 * Prerenders no page at build time. The empty list makes the route static: a page is rendered on its
 * first request and cached until the revalidation webhook expires it, or the hour of its fetches is
 * up.
 *
 * @returns No params.
 */
export function generateStaticParams(): { page: string }[] {
	return [];
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/verein/echo/seite/[page]'>>): Promise<Metadata> {
	const { page } = await params;
	const pageNumber = getLaterPageNumber(page);
	if (!pageNumber) {
		notFound();
	}

	return getEchoArchiveMetadata(pageNumber);
}

export default async function EchoArchiveLaterPage({
	params,
}: Readonly<PageProps<'/verein/echo/seite/[page]'>>) {
	const { page } = await params;
	const pageNumber = getLaterPageNumber(page);
	if (!pageNumber) {
		notFound();
	}

	return <EchoArchive currentPage={pageNumber} />;
}
