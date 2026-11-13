import { Clock, Plus } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { getMailHref } from '@/utils/mail';

import { POSITIONS_ANCHOR } from '../_shared/anchors';
import type { Inquiry, Position, PositionsSection } from '../_shared/types';
import { PositionDetails } from './position-details';

import downloadStyles from '@/app/mitgliedschaft/_sections/downloads.module.css';

/**
 * „Aktuell gesucht“ from variant B: the header and the steps on the left, the open positions as an
 * accordion on the right, the first one open, and a card for an idea of one's own below them.
 * Without a published position the steps and the card stay.
 *
 * @param props - The section, the positions and where the mails go.
 * @param props.inquiry - The address and subject of the mails.
 * @param props.positions - The published positions, newest first.
 * @param props.section - The texts from the studio.
 * @returns The section.
 */
function Positions({ inquiry, positions, section }: Readonly<PositionsProps>) {
	const { cta, intro, otherText, otherTitle, steps, subtitle, title } = section;
	const headings = {
		offer: section.offerHeading,
		profile: section.profileHeading,
		tasks: section.tasksHeading,
	};

	return (
		<section className="relative z-0 bg-background-low-contrast" id={POSITIONS_ANCHOR}>
			<div className={downloadStyles.bg} />
			<div className={downloadStyles.bgBalls} />

			<div className="container py-10 md:py-28 lg:grid lg:grid-cols-[4fr_8fr] lg:gap-16">
				<div className="self-start lg:sticky lg:top-36">
					<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered>
						{intro}
					</SectionHeader>

					{steps?.length ? (
						<ol aria-label="So geht es" className="mt-10 flex flex-col gap-6 border-t pt-8">
							{steps.map((step, index) => (
								<li className="flex gap-4" key={step._key}>
									<span
										aria-hidden="true"
										className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-serif text-xl text-primary-foreground"
									>
										{index + 1}
									</span>
									<span>
										<span className="block font-serif text-xl uppercase">{step.title}</span>
										<span className="block text-sm md:text-base">{step.text}</span>
									</span>
								</li>
							))}
						</ol>
					) : null}
				</div>

				<div className="mt-12 flex flex-col gap-4 lg:mt-0">
					{positions.length > 0 && (
						<Accordion defaultValue={[positions[0]?._id]} multiple={false}>
							{positions.map((position) => (
								<AccordionItem key={position._id} value={position._id}>
									<AccordionTrigger>
										<span className="flex flex-col gap-2 text-left md:flex-row md:items-center md:gap-6">
											<span className="font-serif text-2xl text-foreground uppercase md:text-3xl">
												{position.title}
											</span>
											<span className="flex flex-wrap gap-2">
												<Badge size="sm">{position.area}</Badge>
												{position.effort && (
													<Badge size="sm" variant="ghost">
														<Clock aria-hidden="true" />
														{position.effort}
													</Badge>
												)}
											</span>
										</span>
									</AccordionTrigger>
									<AccordionContent>
										<PositionDetails
											cta={cta}
											headings={headings}
											href={getMailHref(inquiry, position.title)}
											position={position}
										/>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					)}

					{otherTitle && (
						<a
							className={cn(
								'flex items-center gap-4 rounded-xl border-2 border-dashed border-primary/30 p-6 text-primary',
								'transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground',
							)}
							href={getMailHref(inquiry)}
						>
							<Plus aria-hidden="true" className="size-8 shrink-0" />
							<span>
								<span className="block font-serif text-2xl uppercase">{otherTitle}</span>
								{otherText && <span className="block text-sm md:text-base">{otherText}</span>}
							</span>
						</a>
					)}
				</div>
			</div>
		</section>
	);
}

interface PositionsProps {
	inquiry: Inquiry;
	positions: Position[];
	section: PositionsSection;
}

export { Positions };
