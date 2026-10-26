import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import { client } from '@/lib/sanity/client';
import { membershipPageQuery } from '@/lib/sanity/queries/pages/membership';
import type { MembershipPageQueryResult } from '@/types/sanity.types.generated';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';

import { Downloads } from './_sections/downloads';
import { Intro } from './_sections/intro';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<MembershipPageQueryResult>(membershipPageQuery);

	if (!page.membership) {
		return {};
	}

	return getPageMetadata({
		image: page.membership.heroImage,
		meta: page.membership.meta,
		path: '/mitgliedschaft',
		title: page.membership.title,
	});
}

export default async function ContactPage() {
	const page = await client.fetch<MembershipPageQueryResult>(membershipPageQuery);

	if (!page.membership || !page.pricingSection) {
		notFound();
	}

	return (
		<>
			<Hero
				image={getPageHeroImage(page.membership.heroImage, page.membership.title)}
				subTitle={page.membership.subtitle}
				title={page.membership.title}
			/>
			<Intro text={page.membership.intro} />
			<Pricing {...page.pricingSection} />
			<Downloads {...page.membership.downloadsSection} />
			<ContactPersons {...page.membership.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
