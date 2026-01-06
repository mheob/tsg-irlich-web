import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { SectionHeader } from '@/components/ui/section-header';
import { client } from '@/lib/sanity/client';
import {
	newsArticlesPaginatedForCategoryQuery,
	newsArticlesTotalForCategoryQuery,
	newsOverviewCategoryPageQuery,
} from '@/lib/sanity/queries/pages/news-overview-category';
import { newsCategoryQuery } from '@/lib/sanity/queries/shared/news';

import newsOverviewImage from '../_assets/news-overview.webp';
import { LatestNewsPagination } from '../_sections/latest-news-pagination';
import { getOpenGraphImageOptions } from '../_shared/utils';

const START_INDEX = 0;
const ITEMS_PER_PAGE = 9;

function getCurrentPage(page?: string | string[]): {
	currentPage: number;
	end: number;
	start: number;
} {
	const pageString = Array.isArray(page) ? page[0] : page;
	const parsed = Number.parseInt(pageString ?? '1', 10);
	const currentPage = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;
	const end = start + (ITEMS_PER_PAGE - 1);
	return { currentPage, end, start };
}

export async function generateMetadata({
	params,
}: Readonly<PageProps<'/news/[category]'>>): Promise<Metadata> {
	const { category: categoryParameter } = await params;

	const category = await client.fetch(newsCategoryQuery, { slug: categoryParameter });
	if (!category) return {};

	const description = category.meta?.metaDescription ?? '';
	const image = category.meta?.openGraphImage;
	const images = image ? getOpenGraphImageOptions(image, category.title) : [];
	const title = category.meta?.metaTitle ?? category.title ?? '';

	return {
		description,
		openGraph: { description, images, title },
		title,
	};
}

export default async function NewsCategoryPage({
	params,
	searchParams,
}: Readonly<PageProps<'/news/[category]'>>) {
	const { category: categoryParameter } = await params;
	const { seite } = await searchParams;

	const { currentPage, end, start } = getCurrentPage(seite);

	const [page, totalArticles, category, paginatedArticles] = await Promise.all([
		client.fetch(newsOverviewCategoryPageQuery),
		client.fetch(newsArticlesTotalForCategoryQuery, { category: categoryParameter }),
		client.fetch(newsCategoryQuery, { slug: categoryParameter }),
		client.fetch(newsArticlesPaginatedForCategoryQuery, {
			category: categoryParameter,
			end,
			start,
		}),
	]);

	if (!page || !category) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero
				image={{
					alt: 'Ein Handy und ein Kugelschreiber auf einer Zeitung sollen eine Nachrichtenübersicht darstellen.',
					src: newsOverviewImage,
				}}
				subTitle={page.subtitle}
				title={category.title}
			/>

			<section className="container mx-auto py-10 md:py-28">
				<SectionHeader
					title={
						<>
							Aktuelles aus dem Bereich
							{category.title && category.title.trim() !== '' && (
								<>
									{' '}
									<span className="text-primary">{category.title.trim()}</span>
								</>
							)}
						</>
					}
					className="pb-8 md:pb-14"
					subTitle="News"
					isCentered
				/>

				<LatestNewsPagination
					articles={paginatedArticles ?? []}
					currentPage={currentPage}
					hasNextPage={START_INDEX + currentPage * ITEMS_PER_PAGE < totalArticles}
				/>
			</section>

			<ContactPersons {...page.content.contactPersonsSection} />

			<Newsletter />
		</>
	);
}
