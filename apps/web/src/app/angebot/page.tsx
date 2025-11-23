import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import heroImage from '@/images/angebot/hero.webp';
import { client } from '@/lib/sanity/client';
import { offerPageQuery } from '@/lib/sanity/queries/pages/offer';
import { getOGImage } from '@/utils/groups';

import { Groups } from './_sections/groups';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch(offerPageQuery);

	if (!page) return {};

	const { intro, title } = page.content.departmentsSection;

	const image = getOGImage('heroImage');

	return {
		description: intro ?? '',
		openGraph: {
			description: intro ?? '',
			images: image ?? [],
			title,
		},
		title,
	};
}

export default async function OfferPage() {
	const page = await client.fetch(offerPageQuery);

	if (!page) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero
				image={{ alt: 'TSG Irlich Schiedsrichter-Trikot in blau von JAKO', src: heroImage }}
				subTitle={page.subtitle}
				title={page.title}
			/>
			<Groups {...page.content.departmentsSection} />
			<Stats stats={page.content.stats} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
