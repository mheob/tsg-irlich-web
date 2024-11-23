import SectionHeader from '@/components/ui/section-header';
import { features } from '@/data/features';

import FeatureCard from './feature-card';

export default function Features() {
	return (
		<section className="bg-background-lowContrast">
			<div className="container mx-auto py-28">
				<SectionHeader subTitle="Features" title="Wir bieten Dir" isCentered>
					Wir bieten Dir eine Vielzahl von Sportangeboten, die Deine Fitness, Gesundheit und
					Gesundheit steigern. Zudem sehen wir uns nicht als Dienstleister, sondern als Partner, der
					Dir bei Deinem Ziel hilft. Die Gemeinschaft ist unser Hauptanliegen.
				</SectionHeader>

				<div className="mt-16 grid grid-cols-2 place-content-center gap-12">
					{features.map(props => (
						<FeatureCard key={props.title} {...props} />
					))}
				</div>
			</div>
		</section>
	);
}
