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
import type { Venue } from './_shared/types';
import { splitOtherVenues } from './_shared/venues';

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
	// A reference that no longer resolves comes back as `null` from the query.
	const contactPersons = contactPersonsSection.contactPersons.filter(
		(person): person is NonNullable<typeof person> => person !== null,
	);
	const homeVenues = (homeSection?.venues ?? []).filter((venue): venue is Venue => venue !== null);
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
