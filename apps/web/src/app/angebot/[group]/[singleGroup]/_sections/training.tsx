import { cn } from '@tsgi-web/shared';
import type { PortableTextBlock } from 'next-sanity';

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
	const hasTrainingTimes = training?.trainingTimes && training.trainingTimes.length > 0;

	return (
		<section className="bg-background-low-contrast relative z-0">
			<div className="container mx-auto px-5 py-10 md:py-32">
				<SectionHeader className="mb-16" title={title} isCentered isCenteredOnDesktop>
					{training?.trainingDescription && (
						<PortableText value={training.trainingDescription.text as PortableTextBlock[]} />
					)}
				</SectionHeader>

				{hasTrainingTimes && (
					<div
						className={cn(
							/* eslint-disable ts/no-non-null-assertion */
							'grid place-content-center place-items-center gap-6',
							{ 'grid-cols-1': training.trainingTimes!.length === 1 },
							{
								'lg:grid-cols-[repeat(2,minmax(0,var(--container-xl)))]':
									training.trainingTimes!.length === 2,
							},
							{
								'lg:grid-cols-[repeat(2,minmax(0,var(--container-xl)))] 2xl:grid-cols-[repeat(3,minmax(0,var(--container-xl)))]':
									training.trainingTimes!.length >= 3,
							},
							/* eslint-enable ts/no-non-null-assertion */
						)}
					>
						{training.trainingTimes?.map(training => (
							<TrainingCard key={`${training._key}`} training={training} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}
