import { ButtonLink } from '@/components/ui/button';
import { PageIcon } from '@/components/ui/page-icon';
import { SectionHeader } from '@/components/ui/section-header';

import { POSITIONS_ANCHOR } from '../_shared/anchors';
import type { ReasonsSection } from '../_shared/types';

/**
 * „Gemeinsam mehr erreichen“, the first section of variant A: the pitch with a button to the open
 * positions on the left, the reasons as a grid of cards on the right.
 *
 * @param props - The section and whether any position is published.
 * @param props.hasPositions - Without a published position the button would jump to nothing, so it
 *   is left out.
 * @param props.section - The texts and reasons from the studio.
 * @returns The section, or nothing without reasons.
 */
function Reasons({ hasPositions, section }: Readonly<ReasonsProps>) {
	const { cta, intro, reasons, subtitle, title } = section;

	if (!reasons?.length) {
		return null;
	}

	return (
		<section className="bg-background-low-contrast">
			<div className="container py-10 md:py-28 lg:grid lg:grid-cols-[4fr_8fr] lg:items-center lg:gap-16">
				<div>
					<SectionHeader isCenteredOnDesktop={false} subTitle={subtitle} title={title} isCentered>
						{intro}
					</SectionHeader>
					{hasPositions && cta && (
						<div className="mt-10 flex justify-center lg:justify-start">
							<ButtonLink href={`#${POSITIONS_ANCHOR}`} variant="secondary">
								{cta}
							</ButtonLink>
						</div>
					)}
				</div>

				<ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border shadow-lg sm:grid-cols-2 lg:mt-0 xl:grid-cols-3">
					{reasons.map((reason) => (
						<li
							className="group bg-background p-6 transition-colors hover:bg-primary hover:text-primary-foreground"
							key={reason._key}
						>
							<PageIcon
								aria-hidden="true"
								className="size-12 text-primary transition-colors group-hover:text-secondary"
								icon={reason.icon}
								strokeWidth={1}
							/>
							<h3 className="mt-4 font-serif text-2xl uppercase">{reason.title}</h3>
							{/* The global `p` colour does not inherit, so the text follows the hover itself. */}
							<p className="mt-2 text-sm transition-colors group-hover:text-primary-foreground md:text-base">
								{reason.text}
							</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

interface ReasonsProps {
	hasPositions: boolean;
	section: ReasonsSection;
}

export { Reasons };
