import type { Metadata } from 'next';

import ContactPersons from '@/components/section/contact-persons';
import { client } from '@/lib/sanity/client';
import {
	homePageContactPersonsQuery,
	homePageGroupsQuery,
	homePageQuery,
	homePageTestimonialsQuery,
} from '@/lib/sanity/queries/pages/home';
import { newsArticlesQuery } from '@/lib/sanity/queries/shared/news';

import ContactForm from './_home/contact-form';
import Features from './_home/features';
import Groups from './_home/groups';
import Hero from './_home/hero';
import News from './_home/news';
import Newsletter from './_home/newsletter';
import Pricing from './_home/pricing';
import Stats from './_home/stats';
import Testimonials from './_home/testimonials';
import Vision from './_home/vision';

export const metadata: Metadata = {
	description:
		'Die TSG Irlich bietet für jedermann, der sich gerne bewegt und mit Menschen zusammen ist, etwas. In 18 verschiedenen Sparten findest du alles, was du benötigst.',
	title: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
};

export default async function Home() {
	const [page, groups, testimonials, contactPersons, newsArticles] = await Promise.all([
		client.fetch(homePageQuery),
		client.fetch(homePageGroupsQuery),
		client.fetch(homePageTestimonialsQuery),
		client.fetch(homePageContactPersonsQuery, { department: 'Vorstand' }),
		client.fetch(newsArticlesQuery),
	]);

	if (!page) return null;

	return (
		<>
			<Hero intro={page.intro} subtitle={page.subtitle} title={page.title} />
			<Features {...page.content.featureSection} />
			<Vision {...page.content.visionSection} />
			<Groups {...page.content.groupsSection} groups={groups} />
			<Stats {...page.content.statsSection} />
			<Pricing {...page.content.pricingSection} />
			<Testimonials {...page.content.testimonialSection} testimonials={testimonials} />
			<ContactPersons
				{...page.content.contactPersonsSection}
				contactPersons={contactPersons ?? []}
			/>
			<ContactForm />
			<News {...page.content.newsSection} articles={newsArticles} />
			<Newsletter />
		</>
	);
}
