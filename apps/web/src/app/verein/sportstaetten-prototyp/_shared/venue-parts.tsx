// PROTOTYPE (WEB-149) — building blocks both variants share: image, route button, groups, weekdays.

import { CircleCheck, ImageOff, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@tsgi-web/shared';

import { GoToGoogleMaps } from '@/components/section/go-to-google-maps';
import { Button } from '@/components/ui/button';
import { urlForImage } from '@/lib/sanity/utils';

import type { Venue } from './data';
import { getAddressLines, getGroupHref, getTrainingDays, WEEKDAYS } from './venue-utils';

const IMAGE_SIZE = { height: 900, width: 1200 };

function VenueImage({ className, sizes, venue }: Readonly<VenueImageProps>) {
	const src = urlForImage(venue.mainImage, IMAGE_SIZE.height, IMAGE_SIZE.width);

	return (
		<div className={cn('relative overflow-hidden bg-background-low-contrast', className)}>
			{src ? (
				<Image
					alt={venue.mainImage?.alt ?? venue.title}
					className="object-cover"
					sizes={sizes}
					src={src}
					fill
				/>
			) : (
				<span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
					<ImageOff aria-hidden="true" className="size-4" strokeWidth={1.5} />
					Noch kein Foto
				</span>
			)}
		</div>
	);
}

function VenueAddress({ className, venue }: Readonly<VenuePartProps>) {
	const lines = getAddressLines(venue);
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

function VenueRouteButton({ label = 'Route planen', venue, variant }: Readonly<RouteButtonProps>) {
	if (!venue.location) {
		return null;
	}

	return (
		<GoToGoogleMaps
			address={venue.location}
			render={
				<Button size="sm" title="Google Maps wird in einem neuen Tab geöffnet" variant={variant}>
					{label}
				</Button>
			}
		/>
	);
}

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
				<li className="inline-flex rounded-full px-3 py-1 text-sm text-muted-foreground">
					+ {hidden} weitere
				</li>
			)}
		</ul>
	);
}

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
								: 'bg-background-low-contrast text-muted-foreground/60',
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

function FeatureList({ className, features }: Readonly<FeatureListProps>) {
	return (
		<ul className={cn('space-y-2', className)}>
			{features.map((feature) => (
				<li className="flex items-start gap-2" key={feature}>
					<CircleCheck aria-hidden="true" className="mt-0.5 size-5 min-w-6 text-primary-light" />
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

interface VenueImageProps extends VenuePartProps {
	sizes: string;
}

interface VenueGroupsProps extends VenuePartProps {
	limit?: number;
}

interface RouteButtonProps extends VenuePartProps {
	label?: string;
	variant?: 'ghost' | 'primary' | 'secondary';
}

interface FeatureListProps {
	className?: string;
	features: string[];
}

export { FeatureList, VenueAddress, VenueGroups, VenueImage, VenueRouteButton, VenueWeekdays };
