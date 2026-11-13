import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { client } from '@/lib/sanity/client';
import { venuePageQuery } from '@/lib/sanity/queries/pages/venue';
import type { VenuePageQueryResult } from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { VENUE_PAGE_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';

import { Home } from './_sections/home';
import { Others } from './_sections/others';
import { splitOtherVenues } from './_shared/venues';

/**
 * Drops the entries of a dereferenced list that no longer resolve: the query returns `null` for a
 * reference to a deleted or unpublished document.
 *
 * @param items - The list as the query returns it.
 * @returns The entries that resolved.
 */
function resolved<T>(items: null | readonly (null | T)[] | undefined): T[] {
	return (items ?? []).filter((item): item is T => item !== null);
}

export async function generateMetadata(): Promise<Metadata> {
	const { venuePage } = await client.fetch<VenuePageQueryResult>(venuePageQuery);

	if (!venuePage) {
		return {};
	}

	return getPageMetadata({
		// Without a meta description of the editors, the intro of the home section describes the page.
		description: venuePage.content.homeSection?.intro,
		image: venuePage.heroImage,
		meta: venuePage.meta,
		path: VENUE_PAGE_PATH,
		title: venuePage.title,
	});
}

export default async function VenuePage() {
	const { fallbackImage, venuePage, venues } =
		await client.fetch<VenuePageQueryResult>(venuePageQuery);

	if (!venuePage) {
		notFound();
	}

	const { content, inquiry } = venuePage;
	const { contactPersonsSection, homeSection, othersSection } = content;
	const contactPersons = resolved(contactPersonsSection.contactPersons);
	const homeVenues = resolved(homeSection?.venues);
	const { fields, halls } = splitOtherVenues(venues, new Set(homeVenues.map((venue) => venue._id)));

	return (
		<>
			<Hero
				image={getPageHeroImage(venuePage.heroImage, venuePage.title)}
				subTitle={venuePage.subtitle}
				title={venuePage.title}
			/>
			{homeSection && (
				<Home fallbackImage={fallbackImage} inquiry={inquiry} section={homeSection} />
			)}
			{othersSection && (
				<Others
					fallbackImage={fallbackImage}
					fields={fields}
					halls={halls}
					section={othersSection}
				/>
			)}
			<ContactPersons {...contactPersonsSection} contactPersons={contactPersons} />
			<Newsletter />
		</>
	);
}
