import type { Metadata } from 'next';
import { stegaClean } from 'next-sanity';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { SectionHeader } from '@/components/ui/section-header';
import { sanityFetch } from '@/lib/sanity/live';
import { newsOverviewPageQuery } from '@/lib/sanity/queries/pages/news-overview';
import {
	newsArticlesPaginatedQuery,
	newsArticlesQuery,
	newsArticlesTotalQuery,
	newsCategoriesQuery,
} from '@/lib/sanity/queries/shared/news';
import { getPageMetadata } from '@/utils/metadata';
import { getPageNumber, getPaginatedPath } from '@/utils/pagination';

import newsOverviewImage from './_assets/news-overview.webp';
import { CategoryCombobox } from './_sections/category-combobox';
import { LatestNews } from './_sections/latest-news';
import { LatestNewsPagination } from './_sections/latest-news-pagination';

const START_INDEX = 3;
const ITEMS_PER_PAGE = 6;

const HERO_IMAGE = {
	alt: 'Ein Handy und ein Kugelschreiber auf einer Zeitung sollen eine Nachrichtenübersicht darstellen.',
	src: newsOverviewImage,
};

export async function generateMetadata({
	searchParams,
}: Readonly<PageProps<'/news'>>): Promise<Metadata> {
	const [{ data: page }, { seite }] = await Promise.all([
		sanityFetch({ query: newsOverviewPageQuery, stega: false }),
		searchParams,
	]);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		meta: page.meta,
		path: getPaginatedPath('/news', getPageNumber(seite)),
		title: page.title,
	});
}

export default async function NewsOverviewPage({ searchParams }: Readonly<PageProps<'/news'>>) {
	const { seite } = await searchParams;
	const currentPage = getPageNumber(seite);
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;

	const [
		{ data: page },
		{ data: totalArticles },
		{ data: articles },
		{ data: paginatedArticles },
		{ data: categories },
	] = await Promise.all([
		sanityFetch({ query: newsOverviewPageQuery }),
		sanityFetch({ query: newsArticlesTotalQuery }),
		sanityFetch({ query: newsArticlesQuery }),
		sanityFetch({
			params: { end: start + ITEMS_PER_PAGE - 1, start },
			query: newsArticlesPaginatedQuery,
		}),
		sanityFetch({ params: { current: '' }, query: newsCategoriesQuery }),
	]);

	if (!page) {
		return null;
	}

	if (currentPage > 1 && start >= totalArticles) {
		notFound();
	}

	return (
		<>
			<Hero image={HERO_IMAGE} subTitle={page.subtitle} title={page.title} />

			<section className="container mx-auto py-10 md:py-28">
				<div className="flex flex-col gap-6 md:flex-row md:justify-between">
					<SectionHeader subTitle="News" title="Das Aktuellste von der TSG" />
					{/* The titles end up in the input and its filter, where stega characters do not belong. */}
					<CategoryCombobox {...stegaClean(categories)} className="w-full md:w-80 md:shrink-0" />
				</div>
				<LatestNews articles={articles} />

				<section className="mt-10 md:mt-28">
					<h2 className="pb-8 text-xl md:pb-14 md:text-4xl">Alles Wissenswertes</h2>
					{paginatedArticles && (
						<LatestNewsPagination
							articles={paginatedArticles}
							currentPage={currentPage}
							hasNextPage={START_INDEX + currentPage * ITEMS_PER_PAGE < totalArticles}
						/>
					)}
				</section>
			</section>

			<ContactPersons {...stegaClean(page.content.contactPersonsSection)} />

			<Newsletter />
		</>
	);
}
