import { shuffleArray } from '@tsgi-web/shared';
import type { Metadata } from 'next';

import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import { sanityFetch } from '@/lib/sanity/live';
import { homePageQuery, homePageTestimonialsQuery } from '@/lib/sanity/queries/pages/home';
import { newsArticlesQuery } from '@/lib/sanity/queries/shared/news';
import { socialMediaQuery } from '@/lib/sanity/queries/shared/social-media';
import { sponsorsQuery } from '@/lib/sanity/queries/shared/sponsors';

import { Features } from './_home/features';
import { Groups } from './_home/groups';
import { Hero } from './_home/hero';
import { News } from './_home/news';
import { Sponsors } from './_home/sponsors';
import { Testimonials } from './_home/testimonials';
import { getOpenGraphImageOptions } from './news/_shared/utils';

export async function generateMetadata(): Promise<Metadata> {
	const { data: page } = await sanityFetch({ query: homePageQuery });

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

export default async function HomePage() {
	const [
		{ data: page },
		{ data: testimonials },
		{ data: newsArticles },
		{ data: socialMedia },
		{ data: sponsors },
	] = await Promise.all([
		sanityFetch({ query: homePageQuery }),
		sanityFetch({ query: homePageTestimonialsQuery }),
		sanityFetch({ query: newsArticlesQuery }),
		sanityFetch({ query: socialMediaQuery }),
		sanityFetch({ query: sponsorsQuery }),
	]);

	if (!page) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	const shuffledTestimonials =
		testimonials && testimonials.length >= 3 ? shuffleArray(testimonials).slice(0, 3) : [];

	return (
		<>
			<Hero
				intro={page.intro}
				socialMedia={socialMedia}
				subtitle={page.subtitle}
				title={page.title}
			/>
			<Features {...page.content.featureSection} />
			<Vision {...{ ...page.content.visionSection, _type: page._type }} />
			<Groups {...page.content.groupsSection} />
			<Stats stats={page.content.stats} />
			<Pricing {...page.content.pricingSection} />
			<Testimonials {...page.content.testimonialSection} testimonials={shuffledTestimonials} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<ContactForm />
			<News {...page.content.newsSection} articles={newsArticles} />
			{sponsors && sponsors.length > 0 && <Sponsors sponsors={sponsors} />}
			<Newsletter />
		</>
	);
}
