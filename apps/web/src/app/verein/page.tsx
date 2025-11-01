import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import { client } from '@/lib/sanity/client';
import { aboutUsPageQuery } from '@/lib/sanity/queries/pages/about-us';

import heroImage from '../mitgliedschaft/_assets/hero.webp';
import { Intro } from './_sections/intro';

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'Über uns — TSG Irlich',
};

export default async function VereinPage() {
	const page = await client.fetch(aboutUsPageQuery);

	if (!page || !page.content.introSection) {
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
				subTitle={page.subtitle}
				title={page.title}
			/>
			<Intro content={page.content.introSection} />
			<div className="container mx-auto grid h-[50vh] place-content-center bg-blue-200">
				CHRONIC
			</div>
			<Vision {...page.content.visionSection} />
			<Stats stats={page.content.stats} withBackground />
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
