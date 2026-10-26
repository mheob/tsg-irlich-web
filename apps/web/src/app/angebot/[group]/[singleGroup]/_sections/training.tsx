import { cn } from '@tsgi-web/shared';

import { PortableText } from '@/components/ui/portable-text';
import { SectionHeader } from '@/components/ui/section-header';
import { TrainingCard } from '@/components/ui/training-card';
import type { SimpleBlockContent, TrainingTimeSection } from '@/types/sanity.types';

interface TrainingType {
	trainingDescription?: null | SimpleBlockContent;
	trainingTimes?: null | TrainingTimeSection[];
}

interface TrainingProps {
	title: string;
	training?: null | TrainingType;
}

export function Training({ title, training }: Readonly<TrainingProps>) {
	const trainingTimes = training?.trainingTimes ?? [];

	return (
		<section className="relative z-0 bg-background-low-contrast">
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader className="mb-16" title={title} isCentered isCenteredOnDesktop>
					{training?.trainingDescription && (
						<PortableText value={training.trainingDescription.text} />
					)}
				</SectionHeader>

				{trainingTimes.length > 0 && (
					<div
						className={cn(
							'grid place-content-center place-items-center gap-10',
							{ 'grid-cols-1': trainingTimes.length === 1 },
							{
								'lg:grid-cols-[repeat(2,minmax(0,var(--container-xl)))]':
									trainingTimes.length === 2,
							},
							{
								'lg:grid-cols-[repeat(2,minmax(0,var(--container-xl)))] 2xl:grid-cols-[repeat(3,minmax(0,var(--container-xl)))]':
									trainingTimes.length >= 3,
							},
						)}
					>
						{trainingTimes.map((trainingTime) => (
							<TrainingCard key={trainingTime._key} training={trainingTime} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}
