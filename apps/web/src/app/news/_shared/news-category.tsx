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

import { CategoryCombobox } from '../_sections/category-combobox';
import { LatestNewsPagination } from '../_sections/latest-news-pagination';

const START_INDEX = 0;
const ITEMS_PER_PAGE = 9;

/**
 * One page of the articles of a news category.
 *
 * @param props - The category and the page to show.
 * @param props.categoryParameter - The category segment of the request.
 * @param props.currentPage - The page shown, from 1; a page beyond the last one is not found.
 * @returns The page of the category; an unknown category is not found.
 */
async function NewsCategory({ categoryParameter, currentPage }: Readonly<NewsCategoryProps>) {
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;
	const end = start + (ITEMS_PER_PAGE - 1);

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

interface NewsCategoryProps {
	categoryParameter: string;
	currentPage: number;
}

export { NewsCategory };
