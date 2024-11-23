import type { Metadata } from 'next';

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

export default function Home() {
	return (
		<>
			<Hero />
			<Features />
			<Vision />
			<Groups />
			<Stats />
			<Pricing />
			<Testimonials />
			<ContactPersons />
			<ContactForm />
			<News />
			<Newsletter />
		</>
	);
}
