import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { cn } from '@tsgi-web/shared';

import { Hero } from '@/components/section/hero';
import { PortableText } from '@/components/ui/portable-text';
import { client } from '@/lib/sanity/client';
import { privacyPageQuery } from '@/lib/sanity/queries/pages/privacy';
import type { PrivacyPageQueryResult } from '@/types/sanity.types.generated';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';

import { textClassName } from '../_shared/class-names';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<PrivacyPageQueryResult>(privacyPageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: page.heroImage,
		meta: page.meta,
		path: '/datenschutz',
		title: page.title,
	});
}

export default async function PrivacyPage() {
	const page = await client.fetch<PrivacyPageQueryResult>(privacyPageQuery);

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

			<section className="container py-10 md:grid md:grid-cols-8 md:gap-12 md:py-32">
				<div className="md:col-span-1" />
				<aside className={cn('md:col-span-2', textClassName)}>
					<PortableText value={page.introText.text} />
				</aside>

				<article className={cn('md:col-span-5 md:max-w-[65ch]', textClassName)}>
					<PortableText value={page.content.text} />
				</article>
			</section>
		</>
	);
}
