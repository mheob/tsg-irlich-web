import type { Metadata } from 'next';

import { ContactForm } from '@/components/section/contact-form';
import { ContactPersons } from '@/components/section/contact-persons';
import { Newsletter } from '@/components/section/newsletter';
import { Pricing } from '@/components/section/pricing';
import { Stats } from '@/components/section/stats';
import { client } from '@/lib/sanity/client';
import { homePageQuery, homePageTestimonialsQuery } from '@/lib/sanity/queries/pages/home';
import { newsArticlesQuery } from '@/lib/sanity/queries/shared/news';

import { Features } from './_home/features';
import { Groups } from './_home/groups';
import { Hero } from './_home/hero';
import { News } from './_home/news';
import { Testimonials } from './_home/testimonials';
import { Vision } from './_home/vision';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minute

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default async function HomePage() {
	const [page, testimonials, newsArticles] = await Promise.all([
		client.fetch(homePageQuery),
		client.fetch(homePageTestimonialsQuery),
		client.fetch(newsArticlesQuery),
	]);

	if (!page) {
		const { notFound } = await import('next/navigation');
		notFound();
		return null;
	}

	return (
		<>
			<Hero intro={page.intro} subtitle={page.subtitle} title={page.title} />
			<Features {...page.content.featureSection} />
			<Vision {...page.content.visionSection} />
			<Groups {...page.content.groupsSection} />
			<Stats stats={page.content.stats} />
			<Pricing {...page.content.pricingSection} />
			<Testimonials {...page.content.testimonialSection} testimonials={testimonials} />
			<ContactPersons {...page.content.contactPersonsSection} />
			<ContactForm />
			<News {...page.content.newsSection} articles={newsArticles} />
			<Newsletter />
		</>
	);
}
