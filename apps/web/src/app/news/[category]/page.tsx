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
import {
	newsArticlesPaginatedForCategoryQuery,
	newsArticlesTotalForCategoryQuery,
	newsOverviewCategoryPageQuery,
} from '@/lib/sanity/queries/pages/news-overview-category';
import { newsCategoriesQuery, newsCategoryQuery } from '@/lib/sanity/queries/shared/news';
import { getPageMetadata } from '@/utils/metadata';

import newsOverviewImage from '../_assets/news-overview.webp';
import { CategoryCombobox } from '../_sections/category-combobox';
import { LatestNewsPagination } from '../_sections/latest-news-pagination';
import { getPageNumber, getPaginatedPath } from '../_shared/utils';

const START_INDEX = 0;
const ITEMS_PER_PAGE = 9;

const HERO_IMAGE = {
	alt: 'Ein Handy und ein Kugelschreiber auf einer Zeitung sollen eine Nachrichtenübersicht darstellen.',
	src: newsOverviewImage,
};

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

	const { data: category } = await sanityFetch({
		params: { slug: categoryParameter },
		query: newsCategoryQuery,
		stega: false,
	});
	if (!category) {
		return {};
	}

	return getPageMetadata({
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
	]);

	const isBeyondLastPage = currentPage > 1 && start >= totalArticles;
	if (!page || !category || isBeyondLastPage) {
		notFound();
	}

	const isEmpty = totalArticles === 0;

	return (
		<>
			<Hero image={HERO_IMAGE} subTitle={page.subtitle} title={category.title} />

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
							currentPage={currentPage}
							hasNextPage={START_INDEX + currentPage * ITEMS_PER_PAGE < totalArticles}
						/>
					)
				)}
			</section>

			<ContactPersons {...stegaClean(page.content.contactPersonsSection)} />

			<Newsletter />
		</>
	);
}
