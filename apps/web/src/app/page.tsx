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
