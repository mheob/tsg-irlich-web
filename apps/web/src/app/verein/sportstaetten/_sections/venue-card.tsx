import type { FallbackImage, Venue } from '../_shared/types';
import { VenueImage } from '../_shared/venue-image';
import { VenueAddress, VenueGroups, VenueRouteButton, VenueWeekdays } from '../_shared/venue-parts';
import { getTypeLabel } from '../_shared/venues';

/** One column on a phone, two from `md`, three from `xl`, as the grid lays the cards out. */
const IMAGE_SIZES = '(min-width: 80rem) 33vw, (min-width: 48rem) 50vw, 100vw';

/** How many groups a card names before it counts the rest. */
const GROUP_LIMIT = 4;

/**
 * One hall or field: its picture with the kind and the name on it, below them the address, the
 * training days, the groups and the route.
 *
 * @param props - The venue and the fallback image.
 * @param props.fallbackImage - The image of the site settings.
 * @param props.venue - The venue with its groups.
 * @returns The card.
 */
function VenueCard({ fallbackImage, venue }: Readonly<VenueCardProps>) {
	return (
		<article className="flex flex-col overflow-hidden rounded-xl bg-card shadow-lg">
			<div className="relative aspect-video">
				<VenueImage
					className="absolute inset-0"
					fallbackImage={fallbackImage}
					sizes={IMAGE_SIZES}
					venue={venue}
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
				<div className="absolute inset-x-0 bottom-0 p-5">
					<span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground uppercase">
						{getTypeLabel(venue.type)}
					</span>
					<h4 className="mt-3 line-clamp-2 font-serif text-3xl text-primary-foreground uppercase">
						{venue.title}
					</h4>
				</div>
			</div>

			<div className="flex flex-1 flex-col gap-5 p-5">
				<VenueAddress venue={venue} />
				<VenueWeekdays venue={venue} />
				<VenueGroups limit={GROUP_LIMIT} venue={venue} />
				<div className="mt-auto">
					<VenueRouteButton venue={venue} />
				</div>
			</div>
		</article>
	);
}

interface VenueCardProps {
	fallbackImage?: FallbackImage;
	venue: Venue;
}

export { VenueCard };
