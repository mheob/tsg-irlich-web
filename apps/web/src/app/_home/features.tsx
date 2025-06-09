import { SectionHeader } from '@/components/ui/section-header';
import type { Home } from '@/types/sanity.types';

import { FeatureCard } from './feature-card';

type FeaturesProps = Home['content']['featureSection'];

export function Features({ features, intro, subtitle, title }: Readonly<FeaturesProps>) {
	return (
		<section className="bg-background-low-contrast">
			<div className="container mx-auto py-10 md:py-28">
				<SectionHeader subTitle={subtitle} title={title} isCentered>
					{intro}
				</SectionHeader>

				<div className="mt-16 grid grid-cols-1 place-content-center gap-12 md:grid-cols-2">
					{features?.map(({ icon, intro, title }) => {
						if (!icon || !intro || !title) return null;
						return <FeatureCard href="#!" icon={icon} intro={intro} key={title} title={title} />;
					})}
				</div>
			</div>
		</section>
	);
}
