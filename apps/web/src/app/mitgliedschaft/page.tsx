import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import heroImage from '@/images/mitgliedschaft/hero.webp';
import { client } from '@/lib/sanity/client';
import { membershipPageQuery } from '@/lib/sanity/queries/pages/membership';

import { Downloads } from './_sections/downloads';
import { Intro } from './_sections/intro';

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default async function ContactPage() {
	const page = await client.fetch(membershipPageQuery);

	if (!page.membership || !page.pricingSection) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero
				image={{
					alt: 'Das Bild zeigt einen modernen Arbeitsplatz. Im Vordergrund steht ein MacBook Pro mit einem ausgeschalteten Bildschirm auf einem schwarzen Schreibtisch. Rechts daneben befindet sich ein Festnetztelefon und eine kabellose Maus. Im Hintergrund ist ein Büro mit unscharfen Personen und Möbeln erkennbar. Die Szene ist gut ausgeleuchtet und vermittelt eine professionelle Arbeitsatmosphäre.',
					src: heroImage,
				}}
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
