import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { SectionHeader } from '@/components/ui/section-header';
import { SEARCH_PATH } from '@/lib/search/path';
import { getPopularSearches } from '@/lib/search/popular';
import { normalizeSearchInput } from '@/lib/search/query';
import { searchSite } from '@/lib/search/search-site';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';
import { getPageNumber } from '@/utils/pagination';

import { PopularSearches } from './_sections/popular-searches';
import { SearchForm } from './_sections/search-form';
import { SearchHits } from './_sections/search-hits';
import { FALLBACK_TITLE, fetchSearchPage, getSearchPageContent } from './_shared/search-page';
import { getTab, getTotalHits, isBeyondLastPage } from './_shared/search-params';

export async function generateMetadata(): Promise<Metadata> {
	const page = await fetchSearchPage();

	return {
		...getPageMetadata({
			image: page?.heroImage,
			meta: page?.meta,
			path: SEARCH_PATH,
			title: page?.title ?? FALLBACK_TITLE,
		}),
		// A search result is of no use as a landing page, but the links on it are worth following.
		robots: { follow: true, index: false },
	};
}

export default async function SearchPage({ searchParams }: Readonly<PageProps<'/suche'>>) {
	const { q, seite, typ } = await searchParams;
	const query = normalizeSearchInput(q);
	const tab = getTab(typ);
	// „Alle“ has no pages: it shows the best few hits of each group.
	const currentPage = tab === 'alle' ? 1 : getPageNumber(seite);

	// `searchSite` decides what a usable term is and answers `undefined`, without a fetch, otherwise.
	const [page, result] = await Promise.all([
		fetchSearchPage(),
		searchSite(query, { page: currentPage, tab }),
	]);

	if (result && isBeyondLastPage(result, tab, currentPage)) {
		notFound();
	}

	const popularSearches =
		result && getTotalHits(result) > 0 ? undefined : await getPopularSearches();
	const title = page?.title ?? FALLBACK_TITLE;
	const { contactPersonsSection, noResults, searchSection } = getSearchPageContent(page);

	return (
		<>
			<Hero
				image={getPageHeroImage(page?.heroImage, title)}
				subTitle={page?.subtitle}
				title={title}
			/>

			<section className="container mx-auto py-10 md:py-28">
				{searchSection && (
					<SectionHeader subTitle={searchSection.subtitle} title={searchSection.title}>
						{searchSection.intro}
					</SectionHeader>
				)}

				<SearchForm placeholder={searchSection?.placeholder} query={query} tab={tab} />

				{result && (
					<SearchHits currentPage={currentPage} noResults={noResults} result={result} tab={tab} />
				)}

				{popularSearches && <PopularSearches {...popularSearches} />}
			</section>

			{contactPersonsSection && <ContactPersons {...contactPersonsSection} />}

			<Newsletter />
		</>
	);
}
