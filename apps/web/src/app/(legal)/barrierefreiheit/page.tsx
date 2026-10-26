import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { PortableText } from '@/components/ui/portable-text';
import { client } from '@/lib/sanity/client';
import { accessibilityPageQuery } from '@/lib/sanity/queries/pages/accessibility';
import type { AccessibilityPageQueryResult } from '@/types/sanity.types.generated';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';

import { textClassName } from '../_shared/class-names';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<AccessibilityPageQueryResult>(accessibilityPageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: page.heroImage,
		meta: page.meta,
		path: '/barrierefreiheit',
		title: page.title,
	});
}

export default async function AccessibilityPage() {
	const page = await client.fetch<AccessibilityPageQueryResult>(accessibilityPageQuery);

	if (!page) {
		notFound();
	}

	return (
		<>
			<Hero
				image={getPageHeroImage(page.heroImage, page.title)}
				subTitle={page.subtitle}
				title={page.title}
			/>

			<section className="container md:mx-auto md:py-32">
				<article className={cn('mx-auto max-w-[65ch]', textClassName)}>
					<PortableText value={page.content.text} />
				</article>
			</section>
		</>
	);
}
