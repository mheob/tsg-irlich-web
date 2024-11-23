import SectionHeader from '@/components/ui/section-header';

import TestimonialGroup from './testimonial-group';

import styles from './testimonials.module.css';

interface Testimonial {
	firstName: string;
	// image: Image;
	imageSrc: string;
	lastName: string;
	quote: string;
	role: string;
	showAlways: boolean;
}

const testimonials: Testimonial[] = [
	{
		firstName: 'Alexander',
		imageSrc: '',
		lastName: 'Böhm',
		quote:
			'Die TSG Irlich gibt seit weit über einem Jahrhundert den Menschen im Ort und der Region sehr viel. Neben den sportlichen Aktivitäten zählen auch die sozialen Begegnungen für jede Altersklasse extrem.',
		role: 'IT-Administrator und ehemaliger Vorstand',
		showAlways: true,
	},
	{
		firstName: 'Philipp',
		imageSrc: '',
		lastName: 'Pfeiffer',
		quote:
			'Ein Verein, der Tradition, Leidenschaft und Teamgeist lebt. Hier zählt nicht nur der Sport, sondern auch der Zusammenhalt. Jeder wird herzlich aufgenommen, und man fühlt sich sofort als Teil einer großen Familie. Einfach einzigartig!',
		role: 'Vorstandsmitglied',
		showAlways: true,
	},
	{
		firstName: 'Max',
		imageSrc: '',
		lastName: 'Mustermann',
		quote:
			'Als langjähriger Partner schätzen wir die Werte und den Teamgeist dieses traditionellen Vereins. Die Zusammenarbeit ist vertrauensvoll und authentisch – ein echtes Aushängeschild für die Region und eine starke Plattform für unsere Marke.',
		role: 'CEO ChatGPT Company',
		showAlways: true,
	},
];

export default function Testimonials() {
	return (
		<section className={`${styles.bg} bg-background-lowContrast relative z-0`}>
			<div className="container mx-auto grid grid-cols-[40%,60%] px-5 py-32">
				<SectionHeader subTitle="Meinungen und Referenzen" title="Was wird über uns gesagt?" />
				<TestimonialGroup testimonials={testimonials} />
			</div>
		</section>
	);
}
