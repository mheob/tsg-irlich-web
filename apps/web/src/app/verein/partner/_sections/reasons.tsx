import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageIcon } from '@/components/ui/page-icon';
import { SectionHeader } from '@/components/ui/section-header';

import type { ReasonsSection } from '../_shared/types';

// „Warum Sponsor werden?“: the feature cards, laid out like the ones of the home page.
function Reasons({ intro, reasons, subtitle, title }: Readonly<ReasonsSection>) {
	if (!reasons?.length) {
		return null;
	}

	return (
		<section className="bg-background-low-contrast">
			<div className="container mx-auto py-10 md:py-28">
				<SectionHeader subTitle={subtitle} title={title} isCentered isCenteredOnDesktop>
					{intro}
				</SectionHeader>

				<div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
					{reasons.map((reason) => (
						<Card
							className="transition-colors hover:bg-primary hover:text-primary-foreground"
							key={reason._key}
						>
							<PageIcon aria-hidden="true" icon={reason.icon} size={60} strokeWidth={1} />
							<CardHeader>
								<CardTitle className="mt-4 text-xl uppercase md:text-2xl">{reason.title}</CardTitle>
							</CardHeader>
							<CardContent className="mt-2 md:text-lg">{reason.text}</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}

export { Reasons };
