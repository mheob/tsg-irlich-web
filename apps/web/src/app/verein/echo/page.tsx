import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { PortableText } from '@/components/ui/portable-text';
import { client } from '@/lib/sanity/client';
import { aboutUsHeroImageQuery } from '@/lib/sanity/queries/pages/about-us';
import {
	echoContactPersonsQuery,
	echoIssuesQuery,
	echoIssuesTotalQuery,
	echoOverviewPageQuery,
} from '@/lib/sanity/queries/pages/echo';
import type {
	AboutUsHeroImageQueryResult,
	EchoContactPersonsQueryResult,
	EchoIssuesQueryResult,
	EchoIssuesTotalQueryResult,
	EchoOverviewPageQueryResult,
} from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { ECHO_OVERVIEW_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';
import { getPageNumber, getPaginatedPath } from '@/utils/pagination';

import { IssueGrid } from './_sections/issue-grid';
import { LatestIssue } from './_sections/latest-issue';

/** The newest issue has its own card; the grid starts with the second one. */
const START_INDEX = 1;
const ITEMS_PER_PAGE = 12;

export async function generateMetadata({
	searchParams,
}: Readonly<PageProps<'/verein/echo'>>): Promise<Metadata> {
	const [page, heroImage, { seite }] = await Promise.all([
		client.fetch<EchoOverviewPageQueryResult>(echoOverviewPageQuery),
		client.fetch<AboutUsHeroImageQueryResult>(aboutUsHeroImageQuery),
		searchParams,
	]);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: heroImage,
		meta: page.meta,
		path: getPaginatedPath(ECHO_OVERVIEW_PATH, getPageNumber(seite)),
		title: page.title,
	});
}

export default async function EchoOverviewPage({
	searchParams,
}: Readonly<PageProps<'/verein/echo'>>) {
	const { seite } = await searchParams;
	const currentPage = getPageNumber(seite);
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;

	const [page, total, [latest], issues, contactPersons, heroImage] = await Promise.all([
		client.fetch<EchoOverviewPageQueryResult>(echoOverviewPageQuery),
		client.fetch<EchoIssuesTotalQueryResult>(echoIssuesTotalQuery),
		client.fetch<EchoIssuesQueryResult>(echoIssuesQuery, { end: START_INDEX, start: 0 }),
		client.fetch<EchoIssuesQueryResult>(echoIssuesQuery, { end: start + ITEMS_PER_PAGE, start }),
		client.fetch<EchoContactPersonsQueryResult>(echoContactPersonsQuery),
		client.fetch<AboutUsHeroImageQueryResult>(aboutUsHeroImageQuery),
	]);

	if (!page) {
		notFound();
	}

	if (currentPage > 1 && start >= total) {
		notFound();
	}

	return (
		<>
			<Hero
				image={getPageHeroImage(heroImage, page.title)}
				subTitle={page.subtitle}
				title={page.title}
			/>

			<section className="container mx-auto py-10 md:py-28">
				{page.intro && (
					<div className="mx-auto prose max-w-3xl md:prose-xl">
						<PortableText value={page.intro} />
					</div>
				)}

				{latest ? (
					<LatestIssue issue={latest} />
				) : (
					<p className="mt-10 text-center">Noch keine Ausgaben online.</p>
				)}

				{issues.length > 0 && (
					<IssueGrid
						currentPage={currentPage}
						issues={issues}
						perPage={ITEMS_PER_PAGE}
						startIndex={START_INDEX}
						totalIssues={total}
					/>
				)}

				{latest && (
					<p className="mx-auto mt-16 max-w-3xl text-center text-sm md:text-base">
						Du findest dich in einer älteren Ausgabe wieder und möchtest das nicht? Dann melde dich
						über unser{' '}
						<Link className="underline" href="/kontakt">
							Kontaktformular
						</Link>
						.
					</p>
				)}
			</section>

			{contactPersons && <ContactPersons {...contactPersons} />}

			<Newsletter />
		</>
	);
}
