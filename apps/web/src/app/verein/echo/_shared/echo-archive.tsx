import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { PortableText } from '@/components/ui/portable-text';
import { getPageHeroImage } from '@/utils/hero-image';

import { IssueGrid } from '../_sections/issue-grid';
import { LatestIssue } from '../_sections/latest-issue';
import {
	getArchiveContactPersons,
	getArchiveHeroImage,
	getArchivePage,
	getIssues,
	getIssuesTotal,
} from './archive-data';

/** The newest issue has its own card; the grid starts with the second one. */
const START_INDEX = 1;
const ITEMS_PER_PAGE = 12;

/**
 * One page of the TSG-Echo archive: the newest issue, then a page of all the others.
 *
 * @param props - The page to show.
 * @param props.currentPage - The page shown, from 1; a page beyond the last one is not found.
 * @returns The archive; without the archive document it is not found.
 */
async function EchoArchive({ currentPage }: Readonly<EchoArchiveProps>) {
	const start = (currentPage - 1) * ITEMS_PER_PAGE + START_INDEX;

	const [page, total, [latest], issues, contactPersons, heroImage] = await Promise.all([
		getArchivePage(),
		getIssuesTotal(),
		getIssues(0, START_INDEX),
		getIssues(start, start + ITEMS_PER_PAGE),
		getArchiveContactPersons(),
		getArchiveHeroImage(),
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
				{page.intro?.text && (
					<div className="mx-auto prose max-w-3xl md:prose-xl">
						<PortableText value={page.intro.text} />
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

interface EchoArchiveProps {
	currentPage: number;
}

export { EchoArchive };
