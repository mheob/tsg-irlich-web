import type { Metadata } from 'next';

import { client } from '@/lib/sanity/client';
import {
	getHomePage,
	getHomePageContactPersons,
	getHomePageGroups,
	getHomePageNews,
	getHomePageTestimonials,
} from '@/lib/sanity/queries/pages/home';

import ContactForm from './_home/contact-form';
import ContactPersons from './_home/contact-persons';
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
		client.fetch(getHomePage),
		client.fetch(getHomePageGroups),
		client.fetch(getHomePageTestimonials),
		client.fetch(getHomePageContactPersons),
		client.fetch(getHomePageNews),
	]);

	if (!page?.content?.featureSection || !testimonials || !contactPersons || !newsArticles)
		return null;

	return (
		<>
			<Hero intro={page.intro} subtitle={page.subtitle} title={page.title} />
			<Features {...page.content.featureSection} />
			<Vision {...page.content.visionSection} />
			<Groups {...page.content.groupsSection} groups={groups} />
			<Stats {...page.content.statsSection} />
			<Pricing {...page.content.pricingSection} />
			<Testimonials {...page.content.testimonialSection} testimonials={testimonials.values} />
			<ContactPersons
				{...page.content.contactPersonsSection}
				contactPersons={contactPersons.values}
			/>
			<ContactForm />
			<News {...page.content.newsSection} articles={newsArticles} />
			<Newsletter />
		</>
	);
}
