import type { Metadata } from 'next';

import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import contactImage from '@/images/kontakt/hero.webp';
import { sanityFetch } from '@/lib/sanity/live';
import { contactPageQuery } from '@/lib/sanity/queries/pages/contact';

import { getOpenGraphImageOptions } from '../news/_shared/utils';

export async function generateMetadata(): Promise<Metadata> {
	const { data: page } = await sanityFetch({ query: contactPageQuery });

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

export default async function ContactPage() {
	const { data: page } = await sanityFetch({ query: contactPageQuery });

	if (!page) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero
				image={{
					alt: 'Das Bild zeigt einen modernen Arbeitsplatz. Im Vordergrund steht ein MacBook Pro mit einem ausgeschalteten Bildschirm auf einem schwarzen Schreibtisch. Rechts daneben befindet sich ein Festnetztelefon und eine kabellose Maus. Im Hintergrund ist ein Büro mit unscharfen Personen und Möbeln erkennbar. Die Szene ist gut ausgeleuchtet und vermittelt eine professionelle Arbeitsatmosphäre.',
					src: contactImage,
				}}
				subTitle={page.subtitle}
				title={page.title}
			/>
			<ContactForm receiver={page.content.receiver} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
