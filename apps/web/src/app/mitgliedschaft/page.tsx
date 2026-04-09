import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import heroImage from '@/images/mitgliedschaft/hero.webp';
import { client } from '@/lib/sanity/client';
import { membershipPageQuery } from '@/lib/sanity/queries/pages/membership';
import type { MembershipPageQueryResult } from '@/types/sanity.types.generated';

import { getOpenGraphImageOptions } from '../news/_shared/utils';
import { Downloads } from './_sections/downloads';
import { Intro } from './_sections/intro';

const HERO_IMAGE = {
	alt: 'Das Bild zeigt einen modernen Arbeitsplatz. Im Vordergrund steht ein MacBook Pro mit einem ausgeschalteten Bildschirm auf einem schwarzen Schreibtisch. Rechts daneben befindet sich ein Festnetztelefon und eine kabellose Maus. Im Hintergrund ist ein Büro mit unscharfen Personen und Möbeln erkennbar. Die Szene ist gut ausgeleuchtet und vermittelt eine professionelle Arbeitsatmosphäre.',
	src: heroImage,
};

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<MembershipPageQueryResult>(membershipPageQuery);

	if (!page.membership) {
		return {};
	}

	const description = page.membership.meta?.metaDescription ?? '';
	const image = page.membership.meta?.openGraphImage;
	const images = image ? getOpenGraphImageOptions(image, page.membership.title) : [];
	const title = page.membership.meta?.metaTitle ?? page.membership.title ?? '';

	return {
		description,
		openGraph: { description, images, title },
		title,
	};
}

export default async function ContactPage() {
	const page = await client.fetch<MembershipPageQueryResult>(membershipPageQuery);

	if (!page.membership || !page.pricingSection) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero image={HERO_IMAGE} subTitle={page.membership.subtitle} title={page.membership.title} />
			<Intro text={page.membership.intro} />
			<Pricing {...page.pricingSection} />
			<Downloads {...page.membership.downloadsSection} />
			<ContactPersons {...page.membership.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
