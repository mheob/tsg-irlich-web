import SectionHeader from '@/components/ui/section-header';
import type { Home } from '@/types/sanity.types';

import FeatureCard from './feature-card';

type FeaturesProps = Home['content']['featureSection'];

export default function Features({ features, intro, subtitle, title }: Readonly<FeaturesProps>) {
	return (
		<section className="bg-background-lowContrast">
			<div className="container mx-auto py-28">
				<SectionHeader subTitle={subtitle} title={title} isCentered>
					{intro}
				</SectionHeader>

				<div className="mt-16 grid grid-cols-2 place-content-center gap-12">
					{features?.map(({ icon, intro, title }) => {
						if (!icon || !intro || !title) return null;
						return <FeatureCard href="#!" icon={icon} intro={intro} key={title} title={title} />;
					})}
				</div>
			</div>
		</section>
	);
}
