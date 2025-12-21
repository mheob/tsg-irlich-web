import type { Metadata } from 'next';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import heroImage from '@/images/verein/hero.webp';
import { client } from '@/lib/sanity/client';
import { aboutUsPageQuery } from '@/lib/sanity/queries/pages/about-us';

import { getOpenGraphImageOptions } from '../news/_shared/utils';
import { Chronicle } from './_sections/chronicle';
import { Intro } from './_sections/intro';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch(aboutUsPageQuery);

	if (!page) return {};

	const description = page.meta?.metaDescription ?? '';
	const image = page.meta?.openGraphImage;
	const images = image ? getOpenGraphImageOptions(image, page.title) : [];
	const title = page.meta?.metaTitle ?? page.title ?? '';

	return {
		description,
		openGraph: { description, images, title },
		title,
	};
}

export default async function VereinPage() {
	const page = await client.fetch(aboutUsPageQuery);

	if (!page?.content.introSection) {
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
			<Chronicle content={page.content.chronicleSection} />
			<Vision {...{ ...page.content.visionSection, _type: page._type }} />
			<Stats stats={page.content.stats} withBackground />
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
