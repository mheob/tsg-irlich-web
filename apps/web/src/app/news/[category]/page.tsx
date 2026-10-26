import type { Metadata } from 'next';
import { stegaClean } from 'next-sanity';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { sanityFetch } from '@/lib/sanity/live';
import { newsOverviewHeroImageQuery } from '@/lib/sanity/queries/pages/news-overview';
import {
	newsArticlesPaginatedForCategoryQuery,
	newsArticlesTotalForCategoryQuery,
	newsOverviewCategoryPageQuery,
} from '@/lib/sanity/queries/pages/news-overview-category';
import { newsCategoriesQuery, newsCategoryQuery } from '@/lib/sanity/queries/shared/news';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';
import { getPageNumber, getPaginatedPath } from '@/utils/pagination';

import { CategoryCombobox } from '../_sections/category-combobox';
import { LatestNewsPagination } from '../_sections/latest-news-pagination';

const START_INDEX = 0;
const ITEMS_PER_PAGE = 9;

function getCurrentPage(page?: string | string[]): {
	currentPage: number;
	end: number;
	start: number;
} {
	const currentPage = getPageNumber(page);
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;
	const end = start + (ITEMS_PER_PAGE - 1);
	return { currentPage, end, start };
}

export async function generateMetadata({
	params,
	searchParams,
}: Readonly<PageProps<'/news/[category]'>>): Promise<Metadata> {
	const { category: categoryParameter } = await params;
	const { seite } = await searchParams;

	const [{ data: category }, { data: heroImage }] = await Promise.all([
		sanityFetch({ params: { slug: categoryParameter }, query: newsCategoryQuery, stega: false }),
		sanityFetch({ query: newsOverviewHeroImageQuery, stega: false }),
	]);
	if (!category) {
		return {};
	}

	return getPageMetadata({
		image: heroImage,
		meta: category.meta,
		path: getPaginatedPath(`/news/${category.slug ?? categoryParameter}`, getPageNumber(seite)),
		title: category.title,
	});
}

export default async function NewsCategoryPage({
	params,
	searchParams,
}: Readonly<PageProps<'/news/[category]'>>) {
	const { category: categoryParameter } = await params;
	const { seite } = await searchParams;

	const { currentPage, end, start } = getCurrentPage(seite);

	const [
		{ data: page },
		{ data: totalArticles },
		{ data: category },
		{ data: paginatedArticles },
		{ data: categories },
		{ data: heroImage },
	] = await Promise.all([
		sanityFetch({ query: newsOverviewCategoryPageQuery }),
		sanityFetch({
			params: { category: categoryParameter },
			query: newsArticlesTotalForCategoryQuery,
		}),
		sanityFetch({ params: { slug: categoryParameter }, query: newsCategoryQuery }),
		sanityFetch({
			params: { category: categoryParameter, end, start },
			query: newsArticlesPaginatedForCategoryQuery,
		}),
		sanityFetch({ params: { current: categoryParameter }, query: newsCategoriesQuery }),
		sanityFetch({ query: newsOverviewHeroImageQuery }),
	]);

	const isBeyondLastPage = currentPage > 1 && start >= totalArticles;
	if (!page || !category || isBeyondLastPage) {
		notFound();
	}

	const isEmpty = totalArticles === 0;

	return (
		<>
			<Hero
				image={getPageHeroImage(heroImage, category.title)}
				subTitle={page.subtitle}
				title={category.title}
			/>

			<section className="container mx-auto py-10 md:py-28">
				<div className="flex flex-col gap-6 pb-8 md:flex-row md:justify-between md:pb-14">
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
						subTitle="News"
					>
						{isEmpty ? page.content.emptyCategoryNotice : undefined}
					</SectionHeader>
					{/* The titles end up in the input and its filter, where stega characters do not belong. */}
					<CategoryCombobox
						{...stegaClean(categories)}
						className="w-full md:w-80 md:shrink-0"
						currentSlug={categoryParameter}
					/>
				</div>

				{isEmpty ? (
					<div>
						<ButtonLink render={<Link href="/news" />}>Alle News ansehen</ButtonLink>
					</div>
				) : (
					paginatedArticles && (
						<LatestNewsPagination
							articles={paginatedArticles}
							// The route parameter, not the document's slug: stega would mark that one in
							// draft mode, and the markers would end up in every page link.
							basePath={`/news/${categoryParameter}`}
							currentPage={currentPage}
							perPage={ITEMS_PER_PAGE}
							startIndex={START_INDEX}
							totalArticles={totalArticles}
						/>
					)
				)}
			</section>

			<ContactPersons {...stegaClean(page.content.contactPersonsSection)} />

			<Newsletter />
		</>
	);
}
