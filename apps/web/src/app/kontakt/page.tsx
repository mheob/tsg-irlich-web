import type { Metadata } from 'next';

import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { client } from '@/lib/sanity/client';
import {
	contactPageContactPersonsQuery,
	contactPageQuery,
} from '@/lib/sanity/queries/pages/contact';

import contactImage from './_assets/contact.webp';

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default async function Home() {
	const [page, contactPersons] = await Promise.all([
		client.fetch(contactPageQuery),
		client.fetch(contactPageContactPersonsQuery, { department: 'Vorstand' }),
	]);

	if (!page) return null;

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
			<ContactPersons
				{...page.content.contactPersonsSection}
				contactPersons={contactPersons ?? []}
			/>
			<Newsletter />
		</>
	);
}
