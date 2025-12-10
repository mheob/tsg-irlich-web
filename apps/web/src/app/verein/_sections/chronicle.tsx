import { SectionHeader } from '@/components/ui/section-header';
import type { AboutUs } from '@/types/sanity.types';

import { ChronicleCard } from './chronicle-card';

interface ChronicleProps {
	content: NonNullable<AboutUs['content']['chronicleSection']>;
}

export function Chronicle({ content }: Readonly<ChronicleProps>) {
	return (
		<section className="bg-background-low-contrast">
			<div className="container py-10 md:py-28">
				<SectionHeader
					subTitle={content.subtitle}
					title={content.title}
					isCentered
					isCenteredOnDesktop
				>
					{content.intro}
				</SectionHeader>

				<div className="mt-16 grid gap-8 md:gap-16 lg:grid-cols-3">
					{content.chronicleCategories.map(category => (
						<ChronicleCard category={category} key={category._key} />
					))}
				</div>
			</div>
		</section>
	);
}
