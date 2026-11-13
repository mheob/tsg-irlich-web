import type { ReactNode } from 'react';

import { cn } from '@tsgi-web/shared';

import { PortableText } from '@/components/ui/portable-text';

import type { FallbackImage, Venue } from '../_shared/types';
import { VenueImage } from '../_shared/venue-image';
import { FeatureList, VenueAddress, VenueGroups, VenueRouteButton } from '../_shared/venue-parts';
import { getDetailsTitle, getGroupHref, getTypeLabel } from '../_shared/venues';

const IMAGE_SIZES = '(min-width: 64rem) 50vw, 100vw';

/**
 * One of the two venues the club calls home: its picture next to the kind, the name and the whole
 * description, below them a strip with what it offers, how to get there and who trains there, and
 * below that whatever the section puts there, such as the turf box.
 *
 * @param props - The venue, its picture and what follows below it.
 * @param props.children - What the section shows below the venue.
 * @param props.fallbackImage - The image of the site settings.
 * @param props.isReversed - Whether the picture stands on the right, as it does for the second one.
 * @param props.venue - The venue with its groups.
 * @returns The venue.
 */
function HomeVenue({ children, fallbackImage, isReversed, venue }: Readonly<HomeVenueProps>) {
	const hasGroups = venue.groups.some((group) => getGroupHref(group));
	const hasFeatures = Boolean(venue.features?.length);
	const hasStrip = hasFeatures || Boolean(venue.location) || hasGroups;

	return (
		<article>
			<div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
				<VenueImage
					className={cn('aspect-16/10 rounded-2xl shadow-lg', isReversed && 'lg:order-last')}
					fallbackImage={fallbackImage}
					sizes={IMAGE_SIZES}
					venue={venue}
				/>

				<div className="mt-8 lg:mt-0">
					<p className="font-sans-serif font-bold text-primary-light uppercase">
						{getTypeLabel(venue.type)}
					</p>
					<h3 className="mt-1 font-serif text-4xl uppercase md:text-5xl">{venue.title}</h3>
					{venue.description && (
						<div className="mt-4 md:text-lg">
							<PortableText value={venue.description} />
						</div>
					)}
				</div>
			</div>

			{hasStrip && (
				<div className="mt-8 grid gap-8 border-t pt-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
					{hasFeatures && (
						<div>
							<h4 className="mb-3 font-bold">{getDetailsTitle(venue.type)}</h4>
							<FeatureList features={venue.features} />
						</div>
					)}
					{venue.location && (
						<div>
							<h4 className="mb-3 font-bold">So findest du hin</h4>
							<VenueAddress venue={venue} />
							<VenueRouteButton venue={venue} />
						</div>
					)}
					{hasGroups && (
						<div>
							<h4 className="mb-3 font-bold">Hier trainieren</h4>
							<VenueGroups venue={venue} />
						</div>
					)}
				</div>
			)}

			{children}
		</article>
	);
}

interface HomeVenueProps {
	children?: ReactNode;
	fallbackImage?: FallbackImage;
	isReversed?: boolean;
	venue: Venue;
}

export { HomeVenue };
