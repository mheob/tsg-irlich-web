import { cn } from '@tsgi-web/shared';

import { SectionHeader } from '@/components/ui/section-header';

import type { FallbackImage, OthersSection, Venue } from '../_shared/types';
import { VenueCard } from './venue-card';

import groupStyles from '@/app/angebot/[group]/_sections/groups.module.css';

/**
 * A group of venues under its own heading, as a grid of cards.
 *
 * @param props - The venues, their heading and the fallback image.
 * @param props.fallbackImage - The image of the site settings.
 * @param props.title - „Hallen“ or „Plätze“.
 * @param props.venues - The venues of this group.
 * @returns The grid, or nothing while the group holds no venue.
 */
function VenueGrid({ fallbackImage, title, venues }: Readonly<VenueGridProps>) {
	if (venues.length === 0) {
		return null;
	}

	return (
		<div className="mt-12 md:mt-20">
			<h3 className="font-serif text-3xl uppercase md:text-4xl">{title}</h3>
			<div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
				{venues.map((venue) => (
					<VenueCard fallbackImage={fallbackImage} key={venue._id} venue={venue} />
				))}
			</div>
		</div>
	);
}

/**
 * „Weitere Sportanlagen“: every venue that is not a home venue, as halls and fields.
 *
 * @param props - The venues, the section texts and the fallback image.
 * @param props.fallbackImage - The image of the site settings.
 * @param props.fields - The fields, by title.
 * @param props.halls - The halls, by title.
 * @param props.section - The texts from the studio.
 * @returns The section, or nothing while the club has no other venue.
 */
function Others({ fallbackImage, fields, halls, section }: Readonly<OthersProps>) {
	if (halls.length === 0 && fields.length === 0) {
		return null;
	}

	return (
		<section className={cn(groupStyles.bg, 'relative z-0')}>
			<div className="container py-10 md:py-28">
				<SectionHeader
					subTitle={section.subtitle}
					title={section.title}
					isCentered
					isCenteredOnDesktop
				>
					{section.intro}
				</SectionHeader>

				<VenueGrid fallbackImage={fallbackImage} title="Hallen" venues={halls} />
				<VenueGrid fallbackImage={fallbackImage} title="Plätze" venues={fields} />
			</div>
		</section>
	);
}

interface VenueGridProps {
	fallbackImage?: FallbackImage;
	title: string;
	venues: readonly Venue[];
}

interface OthersProps {
	fallbackImage?: FallbackImage;
	fields: readonly Venue[];
	halls: readonly Venue[];
	section: OthersSection;
}

export { Others };
