import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import heroImage from '@/images/angebot/hero.webp';
import { client } from '@/lib/sanity/client';
import { offerPageQuery } from '@/lib/sanity/queries/pages/offer';
import type { OfferPageQueryResult } from '@/types/sanity.types.generated';
import { getPageMetadata } from '@/utils/metadata';

import { Groups } from './_sections/groups';

const HERO_IMAGE = { alt: 'TSG Irlich Schiedsrichter-Trikot in blau von JAKO', src: heroImage };

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<OfferPageQueryResult>(offerPageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({ meta: page.meta, path: '/angebot', title: page.title });
}

export default async function OfferPage() {
	const page = await client.fetch<OfferPageQueryResult>(offerPageQuery);

	if (!page) {
		notFound();
	}

	return (
		<>
			<Hero image={HERO_IMAGE} subTitle={page.subtitle} title={page.title} />
			<Groups {...page.content.departmentsSection} />
			<Stats stats={page.content.stats} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
