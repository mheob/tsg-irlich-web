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
import { urlForImage } from '@/lib/sanity/utils';
import type { PageProps } from '@/types/common';

import newsOverviewImage from '../_assets/news-overview.webp';
import LatestNewsPagination from '../_sections/latest-news-pagination';

const START_INDEX = 0;
const ITEMS_PER_PAGE = 9;

export async function generateMetadata({
	params,
}: PageProps<{ category: string }>): Promise<Metadata> {
	const { category: categoryParameter } = await params;

	const articles = await client.fetch(newsArticlesPaginatedForCategoryQuery, {
		category: categoryParameter,
	});
	const article = articles[0];

	if (!articles) return {};

	return {
		description: article.excerpt ?? '',
		openGraph: {
			description: article.excerpt ?? '',
			images: article.featuredImage
				? [
						{
							alt: article.featuredImage.alt ?? article.title,
							height: 630,
							url: urlForImage(article.featuredImage, 630, 1200) ?? '',
							width: 1200,
						},
					]
				: [],
			title: article.title ?? '',
		},
		title: article.title ?? '',
	};
}

export default async function NewsCategoryPage({
	params,
	searchParams,
}: PageProps<{ category: string }>) {
	const { category: categoryParameter } = await params;
	const { seite } = await searchParams;
	const pageString = Array.isArray(seite) ? seite[0] : seite;
	const currentPage = Number.parseInt(pageString ?? '1', 10);

	const [page, totalArticles, category, paginatedArticles] = await Promise.all([
		client.fetch(newsOverviewCategoryPageQuery),
		client.fetch(newsArticlesTotalForCategoryQuery, { category: categoryParameter }),
		client.fetch(newsCategoryQuery, { slug: categoryParameter }),
		client.fetch(newsArticlesPaginatedForCategoryQuery, {
			category: categoryParameter,
			end: (currentPage - 1) * ITEMS_PER_PAGE + (ITEMS_PER_PAGE - 1) + START_INDEX,
			start: (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX,
		}),
	]);

	if (!page || !category) return null;

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
							Aktuelles aus dem Bereich <span className="text-primary">{category.title}</span>
						</>
					}
					className="pb-8 md:pb-14"
					subTitle="News"
					isCentered
				/>

				<LatestNewsPagination
					articles={paginatedArticles ?? []}
					currentPage={currentPage}
					hasNextPage={totalArticles > currentPage * ITEMS_PER_PAGE}
				/>
			</section>

			<ContactPersons {...page.content.contactPersonsSection} />

			<Newsletter />
		</>
	);
}
