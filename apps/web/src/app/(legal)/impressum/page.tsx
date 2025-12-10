import { cn } from '@tsgi-web/shared';
import Link from 'next/link';

import { Hero } from '@/components/section/hero';
import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import { ContactLink } from '@/components/with-logic/contact-link';
import { client } from '@/lib/sanity/client';
import { imprintPageQuery } from '@/lib/sanity/queries/pages/imprint';

import { textClassName } from '../_shared/class-names';
import heroImage from '../_shared/hero.webp';

export default async function ImprintPage() {
	const page = await client.fetch(imprintPageQuery);

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
					src: heroImage,
				}}
				subTitle={page.subtitle}
				title={page.title}
			/>

			<section className="container md:mx-auto md:py-32">
				<article className={cn('mx-auto max-w-[65ch]', textClassName)}>
					<h2 className="text-3xl font-bold">Impressum</h2>

					<address>
						<PortableText value={page.address.text as PortableTextValue} />
					</address>

					<p>
						Registernummer: {page.registerNo}
						<br />
						Handelsregister: {page.registerCourt}
					</p>

					<p>
						<strong>Vertreten durch:</strong>
					</p>
					<PortableText value={page.represented.text as PortableTextValue} />

					<h3>Kontakt</h3>
					<p>
						E-Mail: <ContactLink href={`mailto:${page.email}`} />
						<br />
						Kontaktformular:{' '}
						<Link href={page.contactForm.slug ?? '/kontakt'}>{page.contactForm.title}</Link>
					</p>

					<h3>Redaktionell verantwortlich</h3>
					<p>{page.responsible}</p>

					<h3>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h3>
					<p>{page.consumerDisputeResolution}</p>

					<h3>Technischer Ansprechpartner</h3>
					<p>
						{page.technicalQuestionsName}
						{' -> '}
						<ContactLink href={`mailto:${page.technicalQuestionsEmail}`} />
					</p>

					<h3>Freundliche Unterstützung durch</h3>
					<PortableText value={page.support.text as PortableTextValue} />

					<h3>Bildnachweise</h3>
					<PortableText value={page.credits.text as PortableTextValue} />
				</article>
			</section>
		</>
	);
}
