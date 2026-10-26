import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Hero } from '@/components/section/hero';
import { Newsletter } from '@/components/section/newsletter';
import { client } from '@/lib/sanity/client';
import { contactPageQuery } from '@/lib/sanity/queries/pages/contact';
import { siteImagesQuery } from '@/lib/sanity/queries/shared/site-images';
import type { ContactPageQueryResult, SiteImagesQueryResult } from '@/types/sanity.types.generated';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';
import { resolveSectionImages } from '@/utils/section-images';

/** The heading of the contact form, the alt text of one of its images that has none. */
const CONTACT_FORM_TITLE = 'Kontaktiere uns';

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<ContactPageQueryResult>(contactPageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({
		image: page.heroImage,
		meta: page.meta,
		path: '/kontakt',
		title: page.title,
	});
}

export default async function ContactPage() {
	const [page, siteImages] = await Promise.all([
		client.fetch<ContactPageQueryResult>(contactPageQuery),
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
			<ContactForm
				images={resolveSectionImages(siteImages?.contactFormImages, CONTACT_FORM_TITLE)}
				receiver={page.content.receiver}
			/>
			<ContactPersons {...page.content.contactPersonsSection} />
			<Newsletter />
		</>
	);
}
