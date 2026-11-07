import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getLaterPageNumber } from '@/utils/pagination';

import { NewsCategory } from '../../../_shared/news-category';
import { getNewsCategoryMetadata } from '../../../_shared/news-category-metadata';

/*
 * The later pages of a category. Their address is `/news/<category>?seite=N`, which
 * `next.config.ts` rewrites to this route; a request for this path itself is redirected there.
 */

/**
 * Prerenders no page at build time. The empty list makes the route static: a page is rendered on its
 * first request and cached until the revalidation webhook expires it.
 *
 * @returns No params.
 */
export function generateStaticParams(): { category: string; page: string }[] {
	return [];
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/news/[category]/seite/[page]'>>): Promise<Metadata> {
	const { category, page } = await params;
	const pageNumber = getLaterPageNumber(page);
	if (!pageNumber) {
		notFound();
	}

	return getNewsCategoryMetadata(category, pageNumber);
}

export default async function NewsCategoryLaterPage({
	params,
}: Readonly<PageProps<'/news/[category]/seite/[page]'>>) {
	const { category, page } = await params;
	const pageNumber = getLaterPageNumber(page);
	if (!pageNumber) {
		notFound();
	}

	return <NewsCategory categoryParameter={category} currentPage={pageNumber} />;
}
