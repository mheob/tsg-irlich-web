import { CircleCheck, MapPin } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@tsgi-web/shared';

import { GoToGoogleMaps } from '@/components/section/go-to-google-maps';
import { Button } from '@/components/ui/button';

import type { Venue } from './types';
import { getAddressLines, getGroupHref, getTrainingDays, WEEKDAYS } from './venues';

/**
 * The address of a venue, with a pin in front of it.
 *
 * @param props - The venue and the layout.
 * @param props.className - Extra classes of the address.
 * @param props.venue - The venue with its location.
 * @returns The address, or nothing while the venue has none.
 */
function VenueAddress({ className, venue }: Readonly<VenuePartProps>) {
	const lines = getAddressLines(venue.location);

	if (!lines) {
		return null;
	}

	return (
		<address className={cn('flex items-start gap-2 not-italic', className)}>
			<MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-light" />
			<span>
				{lines[0]}
				<br />
				{lines[1]}
			</span>
		</address>
	);
}

/**
 * „Route planen“, which opens the usual Google Maps dialog.
 *
 * @param props - The venue and the look of the button.
 * @param props.variant - The look of the button.
 * @param props.venue - The venue with its location.
 * @returns The button, or nothing while the venue has no address to route to.
 */
function VenueRouteButton({ variant = 'secondary', venue }: Readonly<RouteButtonProps>) {
	if (!venue.location) {
		return null;
	}

	return (
		<GoToGoogleMaps
			address={venue.location}
			render={
				<Button size="sm" title="Google Maps wird in einem neuen Tab geöffnet" variant={variant}>
					Route planen
				</Button>
			}
		/>
	);
}

/**
 * The groups that train at a venue, each linked to its page. A group whose department has no slug
 * has no page and is left out.
 *
 * @param props - The venue, the layout and how many groups to show.
 * @param props.className - Extra classes of the list.
 * @param props.limit - How many groups to show before the rest is counted.
 * @param props.venue - The venue with its groups.
 * @returns The list of groups, or nothing while none of them has a page.
 */
function VenueGroups({ className, limit, venue }: Readonly<VenueGroupsProps>) {
	const groups = venue.groups.filter((group) => getGroupHref(group));

	if (groups.length === 0) {
		return null;
	}

	const visible = limit ? groups.slice(0, limit) : groups;
	const hidden = groups.length - visible.length;

	return (
		<ul aria-label="Gruppen, die hier trainieren" className={cn('flex flex-wrap gap-2', className)}>
			{visible.map((group) => (
				<li key={group._id}>
					<Link
						className="inline-flex rounded-full bg-primary-light/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
						href={getGroupHref(group) ?? '/angebot'}
					>
						{group.title}
					</Link>
				</li>
			))}
			{hidden > 0 && (
				<li className="inline-flex px-3 py-1 text-sm text-muted-foreground">+ {hidden} weitere</li>
			)}
		</ul>
	);
}

/**
 * The days of the week somebody trains at a venue. The row of letters is decoration, so a screen
 * reader gets the days spelled out instead.
 *
 * @param props - The venue and the layout.
 * @param props.className - Extra classes of the row.
 * @param props.venue - The venue with its groups.
 * @returns The training days, or nothing while nobody trains there.
 */
function VenueWeekdays({ className, venue }: Readonly<VenuePartProps>) {
	const days = getTrainingDays(venue);

	if (days.size === 0) {
		return null;
	}

	const names = WEEKDAYS.filter((day) => days.has(day.key)).map((day) => day.name);

	return (
		<div className={className}>
			<span className="sr-only">Trainingstage: {names.join(', ')}</span>
			<ol aria-hidden="true" className="flex gap-1">
				{WEEKDAYS.map((day) => (
					<li
						className={cn(
							'grid size-8 place-items-center rounded-md text-xs font-bold',
							days.has(day.key)
								? 'bg-primary text-primary-foreground'
								: 'bg-background-low-contrast text-muted-foreground',
						)}
						key={day.key}
					>
						{day.label}
					</li>
				))}
			</ol>
		</div>
	);
}

/**
 * What a venue offers, as a list with check marks.
 *
 * @param props - The features and the layout.
 * @param props.className - Extra classes of the list.
 * @param props.features - What the venue offers.
 * @returns The list, or nothing while the venue names no feature.
 */
function FeatureList({ className, features }: Readonly<FeatureListProps>) {
	if (!features?.length) {
		return null;
	}

	return (
		<ul className={cn('space-y-2', className)}>
			{features.map((feature) => (
				<li className="flex items-start gap-2" key={feature}>
					<CircleCheck aria-hidden="true" className="mt-0.5 size-5 min-w-5 text-primary-light" />
					{feature}
				</li>
			))}
		</ul>
	);
}

interface VenuePartProps {
	className?: string;
	venue: Venue;
}

interface VenueGroupsProps extends VenuePartProps {
	/** How many groups a card shows before it counts the rest. */
	limit?: number;
}

interface RouteButtonProps {
	variant?: 'ghost' | 'primary' | 'secondary';
	venue: Venue;
}

interface FeatureListProps {
	className?: string;
	features?: null | readonly string[];
}

export { FeatureList, VenueAddress, VenueGroups, VenueRouteButton, VenueWeekdays };
