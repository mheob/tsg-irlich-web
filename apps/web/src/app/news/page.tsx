import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { SectionHeader } from '@/components/ui/section-header';
import { client } from '@/lib/sanity/client';
import { newsOverviewPageQuery } from '@/lib/sanity/queries/pages/news-overview';
import {
	newsArticlesPaginatedQuery,
	newsArticlesQuery,
	newsArticlesTotalQuery,
} from '@/lib/sanity/queries/shared/news';

import newsOverviewImage from './_assets/news-overview.webp';
import { LatestNews } from './_sections/latest-news';
import { LatestNewsPagination } from './_sections/latest-news-pagination';

const START_INDEX = 3;
const ITEMS_PER_PAGE = 6;

export default async function NewsOverviewPage({ searchParams }: Readonly<PageProps<'/news'>>) {
	const { seite } = await searchParams;
	const pageString = Array.isArray(seite) ? seite[0] : seite;
	const currentPage = Number.parseInt(pageString ?? '1', 10);

	const [page, totalArticles, articles, paginatedArticles] = await Promise.all([
		client.fetch(newsOverviewPageQuery),
		client.fetch(newsArticlesTotalQuery),
		client.fetch(newsArticlesQuery),
		client.fetch(newsArticlesPaginatedQuery, {
			end: (currentPage - 1) * ITEMS_PER_PAGE + (ITEMS_PER_PAGE - 1) + START_INDEX,
			start: (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX,
		}),
	]);

	if (!page) return null;

	return (
		<>
			<Hero
				image={{
					alt: 'Ein Handy und ein Kugelschreiber auf einer Zeitung sollen eine Nachrichtenübersicht darstellen.',
					src: newsOverviewImage,
				}}
				subTitle={page.subtitle}
				title={page.title}
			/>

			<section className="container mx-auto py-10 md:py-28">
				<SectionHeader subTitle="News" title="Das Aktuellste von der TSG" isCentered />
				<LatestNews articles={articles} />

				<section className="mt-10 md:mt-28">
					<h2 className="pb-8 text-xl md:pb-14 md:text-4xl">Alles Wissenswertes</h2>
					<LatestNewsPagination
						articles={paginatedArticles ?? []}
						currentPage={currentPage}
						hasNextPage={START_INDEX + currentPage * ITEMS_PER_PAGE < totalArticles}
					/>
				</section>
			</section>

			<ContactPersons {...page.content.contactPersonsSection} />

			<Newsletter />
		</>
	);
}
