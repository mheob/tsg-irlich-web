import { cn } from '@tsgi-web/shared';
import type { Metadata } from 'next';

import { getOpenGraphImageOptions } from '@/app/news/_shared/utils';
import { Hero } from '@/components/section/hero';
import { PortableText, type PortableTextValue } from '@/components/ui/portable-text';
import { sanityFetch } from '@/lib/sanity/live';
import { accessibilityPageQuery } from '@/lib/sanity/queries/pages/accessibility';

import { textClassName } from '../_shared/class-names';
import heroImage from '../_shared/hero.webp';

export async function generateMetadata(): Promise<Metadata> {
	const { data: page } = await sanityFetch({ query: accessibilityPageQuery });

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

export default async function AccessibilityPage() {
	const { data: page } = await sanityFetch({ query: accessibilityPageQuery });

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
					<PortableText value={page.content.text as PortableTextValue} />
				</article>
			</section>
		</>
	);
}
