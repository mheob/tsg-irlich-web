import type { Metadata } from 'next';

import { NewsCategory } from '../_shared/news-category';
import { getNewsCategoryMetadata } from '../_shared/news-category-metadata';

/*
 * The first page of a category. It reads no search parameters, so it is cached; `next.config.ts`
 * rewrites `/news/<category>?seite=N` to `seite/[page]`, which serves the later pages.
 */

/**
 * Prerenders no category at build time. The empty list makes the route static: a category is
 * rendered on its first request and cached until the revalidation webhook expires it.
 *
 * @returns No params.
 */
export function generateStaticParams(): { category: string }[] {
	return [];
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/news/[category]'>>): Promise<Metadata> {
	const { category } = await params;
	return getNewsCategoryMetadata(category, 1);
}

export default async function NewsCategoryPage({
	params,
}: Readonly<PageProps<'/news/[category]'>>) {
	const { category } = await params;
	return <NewsCategory categoryParameter={category} currentPage={1} />;
}
