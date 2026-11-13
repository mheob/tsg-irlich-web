import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { client } from '@/lib/sanity/client';
import { volunteerPageQuery } from '@/lib/sanity/queries/pages/volunteer';
import type { VolunteerPageQueryResult } from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { VOLUNTEER_PAGE_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';

import { Areas } from './_sections/areas';
import { Positions } from './_sections/positions';
import { Reasons } from './_sections/reasons';
import { Voices } from './_sections/voices';

/**
 * Drops the entries of a dereferenced list that no longer resolve: the query returns `null` for a
 * reference to a deleted or unpublished document.
 *
 * @param items - The list as the query returns it.
 * @returns The entries that resolved.
 */
function resolved<T>(items: readonly (null | T)[] | null | undefined): T[] {
	return (items ?? []).filter((item): item is T => item !== null);
}

export async function generateMetadata(): Promise<Metadata> {
	const { volunteerPage } = await client.fetch<VolunteerPageQueryResult>(volunteerPageQuery);

	if (!volunteerPage) {
		return {};
	}

	return getPageMetadata({
		// Without a meta description of the editors, the intro of the first section describes the page.
		description: volunteerPage.content.whySection?.intro,
		image: volunteerPage.heroImage,
		meta: volunteerPage.meta,
		path: VOLUNTEER_PAGE_PATH,
		title: volunteerPage.title,
	});
}

export default async function VolunteerPage() {
	const { positions, volunteerPage } =
		await client.fetch<VolunteerPageQueryResult>(volunteerPageQuery);

	if (!volunteerPage) {
		notFound();
	}

	const { content, inquiry } = volunteerPage;
	const { areasSection, contactPersonsSection, positionsSection, voicesSection, whySection } =
		content;

	return (
		<>
			<Hero
				image={getPageHeroImage(volunteerPage.heroImage, volunteerPage.title)}
				subTitle={volunteerPage.subtitle}
				title={volunteerPage.title}
			/>
			{whySection && (
				<Reasons
					hasPositions={Boolean(positionsSection) && positions.length > 0}
					section={whySection}
				/>
			)}
			{voicesSection && (
				<Voices section={voicesSection} testimonials={resolved(voicesSection.testimonials)} />
			)}
			{areasSection && <Areas section={areasSection} />}
			{positionsSection && (
				<Positions inquiry={inquiry} positions={positions} section={positionsSection} />
			)}
			<ContactPersons
				{...contactPersonsSection}
				contactPersons={resolved(contactPersonsSection.contactPersons)}
			/>
			<Newsletter />
		</>
	);
}
