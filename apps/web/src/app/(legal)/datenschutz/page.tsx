import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import { client } from '@/lib/sanity/client';
import { privacyPageQuery } from '@/lib/sanity/queries/pages/privacy';

import { textClassName } from '../_shared/class-names';
import heroImage from '../_shared/hero.webp';

export default async function PrivacyPageTsx() {
	const page = await client.fetch(privacyPageQuery);

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

			<section className="px-5 md:container md:mx-auto md:grid md:grid-cols-8 md:gap-12 md:py-32">
				<div className="col-span-1" />
				<aside className={cn('col-span-2', textClassName)}>
					<PortableText value={page.introText.text as PortableTextValue} />
				</aside>

				<article className={cn('col-span-5 max-w-[65ch]', textClassName)}>
					<PortableText value={page.content.text as PortableTextValue} />
				</article>
			</section>
		</>
	);
}
