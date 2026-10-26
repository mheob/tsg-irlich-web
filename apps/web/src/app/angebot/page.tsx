import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { Stats } from '@/components/section/stats';
import { client } from '@/lib/sanity/client';
import { departmentCardsQuery } from '@/lib/sanity/queries/departments';
import { offerPageQuery } from '@/lib/sanity/queries/pages/offer';
import { siteImagesQuery } from '@/lib/sanity/queries/shared/site-images';
import type {
	DepartmentCardsQueryResult,
	OfferPageQueryResult,
	SiteImagesQueryResult,
} from '@/types/sanity.types.generated';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';

import { Groups } from './_sections/groups';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<OfferPageQueryResult>(offerPageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: page.heroImage,
		meta: page.meta,
		path: '/angebot',
		title: page.title,
	});
}

export default async function OfferPage() {
	const [page, departments, siteImages] = await Promise.all([
		client.fetch<OfferPageQueryResult>(offerPageQuery),
		client.fetch<DepartmentCardsQueryResult>(departmentCardsQuery),
		client.fetch<SiteImagesQueryResult>(siteImagesQuery),
	]);

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
			<Groups
				{...page.content.departmentsSection}
				departments={departments}
				fallbackImage={siteImages?.fallbackImage}
			/>
			<Stats stats={page.content.stats} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
