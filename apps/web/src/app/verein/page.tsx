import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import { client } from '@/lib/sanity/client';
import { aboutUsPageQuery } from '@/lib/sanity/queries/pages/about-us';
import { siteImagesQuery } from '@/lib/sanity/queries/shared/site-images';
import type { AboutUsPageQueryResult, SiteImagesQueryResult } from '@/types/sanity.types.generated';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';
import { resolveSectionImages } from '@/utils/section-images';

import { Chronicle } from './_sections/chronicle';
import { Intro } from './_sections/intro';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<AboutUsPageQueryResult>(aboutUsPageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: page.heroImage,
		meta: page.meta,
		path: '/verein',
		title: page.title,
	});
}

export default async function VereinPage() {
	const [page, siteImages] = await Promise.all([
		client.fetch<AboutUsPageQueryResult>(aboutUsPageQuery),
		client.fetch<SiteImagesQueryResult>(siteImagesQuery),
	]);

	if (!page?.content.introSection) {
		notFound();
	}

	return (
		<>
			<Hero
				image={getPageHeroImage(page.heroImage, page.title)}
				subTitle={page.subtitle}
				title={page.title}
			/>
			<Intro content={page.content.introSection} />
			<Chronicle content={page.content.chronicleSection} />
			<Vision
				{...{ ...page.content.visionSection, _type: page._type }}
				images={resolveSectionImages(siteImages?.visionImages, page.content.visionSection.title)}
			/>
			<Stats stats={page.content.stats} withBackground />
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
