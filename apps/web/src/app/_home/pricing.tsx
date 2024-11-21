import { Crown, Gem, Rocket } from 'lucide-react';

import PricingCard from '@/components/ui/pricing-card';
import SectionHeader from '@/components/ui/section-header';

import styles from './pricing.module.css';

interface PriceCardContent {
	benefits: string[];
	benefitsTitle: string;
	cta: string;
	intro: string;
	price: number;
	subtitle: string;
	title: string;
}

const pricingYouth: PriceCardContent = {
	benefits: [
		'in jeder Abteilung du magst',
		'in Menschen in deinem Alter',
		'angeleitet durch qualifizierte Personen',
	],
	benefitsTitle: 'Trainiere',
	cta: 'Loslegen',
	intro: 'Schüler, Studenten, Azubis über dem 18. Lebensjahr benötigen einen gesonderten Nachweis.',
	price: 7,
	subtitle: 'bis 18 Jahre',
	title: 'Jugend',
};

const pricingAdult: PriceCardContent = {
	benefits: ['in jeder Abteilung du magst', 'mit Menschen, die gleiche Ziele verfolgen'],
	benefitsTitle: 'Trainiere',
	cta: 'Loslegen',
	intro:
		'Treibe selbst Sport oder unterstütze den Verein, die Tradition und das Vereinsleben zu organisieren.',
	price: 10,
	subtitle: 'ab 18 Jahre',
	title: 'Erwachsene',
};

const pricingFamily: PriceCardContent = {
	benefits: ['Office ipsum you', 'Potter ipsum wand elf', 'Hipster ipsum', 'Figma ipsum'],
	benefitsTitle: 'Inbegriffen ist',
	cta: 'Loslegen',
	intro: 'Familienmitglieder können sich in der Familienmitgliedschaft bewerben.',
	price: 15,
	subtitle: 'für Familien',
	title: 'Familie',
};

export default function Pricing() {
	return (
		<section className={`${styles.bg} bg-primary relative z-0 text-white`}>
			<div className="container mx-auto px-5 py-28">
				<SectionHeader
					descriptionClassName="text-primary-foreground"
					subTitle="Mitgliedsbeiträge"
					title="Der richtige Preis für Dich und Euch"
					isCentered
				>
					Lorem ipsum dolor sit amet consectetur. Adipiscing in eu tempus feugiat enim placerat.
					Cursus commodo lorem sit fringilla augue.
				</SectionHeader>

				<div className="mt-32 flex justify-center gap-12">
					<PricingCard {...pricingYouth}>
						<Rocket size="40" stroke="currentColor" strokeWidth="1" />
					</PricingCard>

					<PricingCard {...pricingAdult} isHighlighted>
						<Gem size="40" stroke="currentColor" strokeWidth="1" />
					</PricingCard>

					<PricingCard {...pricingFamily}>
						<Crown size="40" stroke="currentColor" strokeWidth="1" />
					</PricingCard>
				</div>
			</div>
		</section>
	);
}
