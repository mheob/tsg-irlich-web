import { Plus } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { SectionHeader } from '@/components/ui/section-header';

import { getMailHref } from '../_shared/mail';
import { getPartnerColumns } from '../_shared/partner-grid';
import type { PartnerColumns } from '../_shared/partner-grid';
import type { Inquiry, PartnersSection, Sponsor } from '../_shared/types';
import { SponsorTile } from './sponsor-tile';

// Spelled out in full, so Tailwind finds every class it has to generate.
const MD_COLUMNS = {
	2: 'md:grid-cols-2',
	3: 'md:grid-cols-3',
} as const satisfies Record<PartnerColumns['md'], string>;
const XL_COLUMNS = {
	3: 'xl:grid-cols-3',
	4: 'xl:grid-cols-4',
} as const satisfies Record<PartnerColumns['xl'], string>;
const XXL_COLUMNS = {
	3: '2xl:grid-cols-3',
	4: '2xl:grid-cols-4',
	5: '2xl:grid-cols-5',
} as const satisfies Record<PartnerColumns['2xl'], string>;
const WIDE_LAST_TILE = 'col-span-2 md:col-span-1';

// „Unsere Partner und Sponsoren“: a logo wall on the light section, grey until hovered, ending
// with the tile that invites the next partner. `getPartnerColumns` sizes the rows so that tile never
// stands alone in the last one.
function Partners({ inquiry, section, sponsors }: Readonly<PartnersProps>) {
	if (sponsors.length === 0 && !section.ownLogoText) {
		return null;
	}

	const tileCount = sponsors.length + (section.ownLogoText ? 1 : 0);
	const columns = getPartnerColumns(tileCount);
	const lastTileClassName = columns.isLastTileWide ? WIDE_LAST_TILE : undefined;

	return (
		<section className="bg-background-low-contrast" id="partner">
			<div className="container py-10 md:py-28">
				<SectionHeader
					subTitle={section.subtitle}
					title={section.title}
					isCentered
					isCenteredOnDesktop
				>
					{section.intro}
				</SectionHeader>

				<ul
					className={cn(
						'mt-10 grid grid-cols-2 gap-4 md:mt-16 md:gap-6',
						MD_COLUMNS[columns.md],
						XL_COLUMNS[columns.xl],
						XXL_COLUMNS[columns['2xl']],
					)}
				>
					{sponsors.map((sponsor, index) => (
						<li
							className={index === tileCount - 1 ? lastTileClassName : undefined}
							key={sponsor._id}
						>
							<SponsorTile sponsor={sponsor} />
						</li>
					))}
					{section.ownLogoText ? (
						<li className={lastTileClassName}>
							<a
								className={cn(
									'flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 p-6 text-center text-primary',
									'transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground',
									'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
								)}
								href={getMailHref(inquiry)}
							>
								<Plus aria-hidden="true" className="size-8" />
								<span className="font-serif text-2xl uppercase">{section.ownLogoText}</span>
							</a>
						</li>
					) : null}
				</ul>
			</div>
		</section>
	);
}

interface PartnersProps {
	inquiry: Inquiry;
	section: PartnersSection;
	sponsors: Sponsor[];
}

export { Partners };
