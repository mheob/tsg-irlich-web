import ContactPersons from '@/components/section/contact-persons';
import Hero from '@/components/section/hero';
import SectionHeader from '@/components/ui/section-header';
import { client } from '@/lib/sanity/client';
import {
	newsOverviewContactPersonsQuery,
	newsOverviewHeroQuery,
} from '@/lib/sanity/queries/pages/news-overview';
import { newsArticlesPaginatedQuery, newsArticlesQuery } from '@/lib/sanity/queries/shared/news';

import newsOverviewImage from './_assets/news-overview.webp';
import LatestNews from './_sections/latest-news';
import LatestNewsPagination from './_sections/latest-news-pagination';

export default async function NewsOverview() {
	const [page, articles, paginatedArticles, contactPersons] = await Promise.all([
		client.fetch(newsOverviewHeroQuery),
		client.fetch(newsArticlesQuery),
		client.fetch(newsArticlesPaginatedQuery, { lastId: '', lastUpdatedAt: '' }),
		client.fetch(newsOverviewContactPersonsQuery, { department: 'PR-Team' }),
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
				<LatestNewsPagination articles={paginatedArticles} />
			</section>

			<ContactPersons
				{...page.content.contactPersonsSection}
				contactPersons={contactPersons ?? []}
			/>

			<div className="bg-background border-background-high-contrast border-b-6 border-t-6 h-5 w-full" />
		</>
	);
}
