// oxlint-disable import/max-dependencies

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EMPTY_ARRAY, shuffleArray } from '@tsgi-web/shared';

import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import { CONTACT_FORM_TITLE } from '@/constants/contact-form';
import { client } from '@/lib/sanity/client';
import { departmentCardsQuery } from '@/lib/sanity/queries/departments';
import { homePageQuery, homePageTestimonialsQuery } from '@/lib/sanity/queries/pages/home';
import { newsArticlesQuery } from '@/lib/sanity/queries/shared/news';
import { siteImagesQuery } from '@/lib/sanity/queries/shared/site-images';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { sponsorsQuery } from '@/lib/sanity/queries/shared/sponsors';
import type {
	DepartmentCardsQueryResult,
	HomePageQueryResult,
	HomePageTestimonialsQueryResult,
	NewsArticlesQueryResult,
	SiteImagesQueryResult,
	SocialMediaQueryResult,
	SponsorsQueryResult,
} from '@/types/sanity.types';
import { getPageHeroImage } from '@/utils/hero-image';
import { getPageMetadata } from '@/utils/metadata';
import { resolveSectionImages } from '@/utils/section-images';

import { Features } from './_home/features';
import { Groups } from './_home/groups';
import { Hero } from './_home/hero';
import { News } from './_home/news';
import { Sponsors } from './_home/sponsors';
import { Testimonials } from './_home/testimonials';

// oxlint-disable-next-line no-magic-numbers
const TESTIMONIALS_REVALIDATE_SECONDS = 60 * 60 * 12;

export async function generateMetadata(): Promise<Metadata> {
	const page = await client.fetch<HomePageQueryResult>(homePageQuery);

	if (!page) {
		return {};
	}

	return getPageMetadata({ meta: page.meta, path: '/', title: page.title });
}

export default async function HomePage() {
	const [page, departments, testimonials, newsArticles, socialMedia, sponsors, siteImages] =
		await Promise.all([
			client.fetch<HomePageQueryResult>(homePageQuery),
			client.fetch<DepartmentCardsQueryResult>(departmentCardsQuery),
			client.fetch<HomePageTestimonialsQueryResult>(
				homePageTestimonialsQuery,
				{},
				{ next: { revalidate: TESTIMONIALS_REVALIDATE_SECONDS } },
			),
			client.fetch<NewsArticlesQueryResult>(newsArticlesQuery),
			client.fetch<SocialMediaQueryResult>(socialMediaQuery),
			client.fetch<SponsorsQueryResult>(sponsorsQuery),
			client.fetch<SiteImagesQueryResult>(siteImagesQuery),
		]);

	if (!page) {
		notFound();
	}

	const shuffledTestimonials =
		testimonials && testimonials.length >= 3 ? shuffleArray(testimonials).slice(0, 3) : EMPTY_ARRAY;

	return (
		<>
			<Hero
				image={getPageHeroImage(page.heroImage, page.title)}
				intro={page.intro}
				socialMedia={socialMedia}
				subtitle={page.subtitle}
				title={page.title}
			/>
			<Features {...page.content.featureSection} />
			<Vision
				{...{ ...page.content.visionSection, _type: page._type }}
				images={resolveSectionImages(siteImages?.visionImages, page.content.visionSection.title)}
			/>
			<Groups {...page.content.groupsSection} departments={departments} />
			<Stats stats={page.content.stats} />
			<Pricing {...page.content.pricingSection} />
			<Testimonials {...page.content.testimonialSection} testimonials={shuffledTestimonials} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<ContactForm
				images={resolveSectionImages(siteImages?.contactFormImages, CONTACT_FORM_TITLE)}
			/>
			<News {...page.content.newsSection} articles={newsArticles} />
			{sponsors && sponsors.length > 0 && <Sponsors sponsors={sponsors} />}
			<Newsletter />
		</>
	);
}
