import { Plus } from 'lucide-react';

import { cn } from '@tsgi-web/shared';

import { SectionHeader } from '@/components/ui/section-header';

import { getMailHref } from '../_shared/mail';
import type { Inquiry, PartnersSection, Sponsor } from '../_shared/types';
import { SponsorTile } from './sponsor-tile';

// „Unsere Partner und Sponsoren“: a logo wall on the light section, grey until hovered, ending
// with the tile that invites the next partner.
function Partners({ inquiry, section, sponsors }: Readonly<PartnersProps>) {
	if (sponsors.length === 0 && !section.ownLogoText) {
		return null;
	}

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

				<ul className="mt-10 grid grid-cols-2 gap-4 md:mt-16 md:gap-6 lg:grid-cols-4">
					{sponsors.map((sponsor) => (
						<li key={sponsor._id}>
							<SponsorTile sponsor={sponsor} />
						</li>
					))}
					{section.ownLogoText ? (
						<li>
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
