import { shuffleArray } from '@tsgi-web/shared';
import type { Metadata } from 'next';

import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import { Stats } from '@/components/section/stats';
import { Vision } from '@/components/section/vision';
import { client } from '@/lib/sanity/client';
import { homePageQuery, homePageTestimonialsQuery } from '@/lib/sanity/queries/pages/home';
import { newsArticlesQuery } from '@/lib/sanity/queries/shared/news';

import { Features } from './_home/features';
import { Groups } from './_home/groups';
import { Hero } from './_home/hero';
import { News } from './_home/news';
import { Testimonials } from './_home/testimonials';

const TESTIMONIALS_REVALIDATE_SECONDS = 60 * 60 * 12; /* 12 hours */

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default async function HomePage() {
	const [page, testimonials, newsArticles] = await Promise.all([
		client.fetch(homePageQuery),
		client.fetch(
			homePageTestimonialsQuery,
			{},
			{ next: { revalidate: TESTIMONIALS_REVALIDATE_SECONDS } },
		),
		client.fetch(newsArticlesQuery),
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
			<Hero intro={page.intro} subtitle={page.subtitle} title={page.title} />
			<Features {...page.content.featureSection} />
			<Vision {...{ ...page.content.visionSection, _type: page._type }} />
			<Groups {...page.content.groupsSection} />
			<Stats stats={page.content.stats} />
			<Pricing {...page.content.pricingSection} />
			<Testimonials {...page.content.testimonialSection} testimonials={shuffledTestimonials} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<ContactForm />
			<News {...page.content.newsSection} articles={newsArticles} />
			<Newsletter />
		</>
	);
}
