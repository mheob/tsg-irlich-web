import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { cn } from '@tsgi-web/shared';

import { getOpenGraphImageOptions } from '@/app/news/_shared/utils';
import { Hero } from '@/components/section/hero';
import { PortableText } from '@/components/ui/portable-text';
import { client } from '@/lib/sanity/client';
import { accessibilityPageQuery } from '@/lib/sanity/queries/pages/accessibility';
import type { AccessibilityPageQueryResult } from '@/types/sanity.types.generated';

import { textClassName } from '../_shared/class-names';
import heroImage from '../_shared/hero.webp';

const HERO_IMAGE = {
	alt: 'Das Bild zeigt einen modernen Arbeitsplatz. Im Vordergrund steht ein MacBook Pro mit einem ausgeschalteten Bildschirm auf einem schwarzen Schreibtisch. Rechts daneben befindet sich ein Festnetztelefon und eine kabellose Maus. Im Hintergrund ist ein Büro mit unscharfen Personen und Möbeln erkennbar. Die Szene ist gut ausgeleuchtet und vermittelt eine professionelle Arbeitsatmosphäre.',
	src: heroImage,
};

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<AccessibilityPageQueryResult>(accessibilityPageQuery);

	if (!page) {
		return {};
	}

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

export default async function AccessibilityPage() {
	const page = await client.fetch<AccessibilityPageQueryResult>(accessibilityPageQuery);

	if (!page) {
		notFound();
	}

	return (
		<>
			<Hero image={HERO_IMAGE} subTitle={page.subtitle} title={page.title} />

			<section className="container md:mx-auto md:py-32">
				<article className={cn('mx-auto max-w-[65ch]', textClassName)}>
					<PortableText value={page.content.text} />
				</article>
			</section>
		</>
	);
}
