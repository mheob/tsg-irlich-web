import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { client } from '@/lib/sanity/client';
import { partnerPageQuery } from '@/lib/sanity/queries/pages/partner';
import type { PartnerPageQueryResult } from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { PARTNER_PAGE_PATH } from '@/utils/links';
import { getPageMetadata } from '@/utils/metadata';

import { Partners } from './_sections/partners';
import { Reasons } from './_sections/reasons';
import { Ways } from './_sections/ways';

export async function generateMetadata(): Promise<Metadata> {
	const { partnerPage } = await client.fetch<PartnerPageQueryResult>(partnerPageQuery);

	if (!partnerPage) {
		return {};
	}

	return getPageMetadata({
		// Without a meta description of the editors, the intro of the first section describes the page.
		description: partnerPage.content.whySection?.intro,
		image: partnerPage.heroImage,
		meta: partnerPage.meta,
		path: PARTNER_PAGE_PATH,
		title: partnerPage.title,
	});
}

export default async function PartnerPage() {
	const { partnerPage, sponsors } = await client.fetch<PartnerPageQueryResult>(partnerPageQuery);

	if (!partnerPage) {
		notFound();
	}

	const { content, inquiry } = partnerPage;
	const { contactPersonsSection, partnersSection, waysSection, whySection } = content;
	// A reference that no longer resolves comes back as `null` from the query.
	const contactPersons = contactPersonsSection.contactPersons.filter(
		(person): person is NonNullable<typeof person> => person !== null,
	);

	return (
		<>
			<Hero
				image={getPageHeroImage(partnerPage.heroImage, partnerPage.title)}
				subTitle={partnerPage.subtitle}
				title={partnerPage.title}
			/>
			{whySection && <Reasons {...whySection} />}
			{waysSection && <Ways {...waysSection} inquiry={inquiry} />}
			{partnersSection && (
				<Partners inquiry={inquiry} section={partnersSection} sponsors={sponsors} />
			)}
			<ContactPersons {...contactPersonsSection} contactPersons={contactPersons} />
			<Newsletter />
		</>
	);
}
