// cSpell:words friday monday saturday sunday thursday tuesday wednesday
import { cn } from '@tsgi-web/shared';
import { Calendar, Clock, CloudSnow, MapPin, Sun } from 'lucide-react';

import type { TrainingTimeSection } from '@/types/sanity.types';
import { printGoogleMapsLink } from '@/utils/url';

import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { ExternalLink } from './external-link';

interface TrainingCardProps {
	training: TrainingTimeSection;
}

const WEEKDAY_LABELS = {
	friday: 'Freitag',
	monday: 'Montag',
	saturday: 'Samstag',
	sunday: 'Sonntag',
	thursday: 'Donnerstag',
	tuesday: 'Dienstag',
	wednesday: 'Mittwoch',
} as const;

const SEASON_LABELS = {
	summer: 'Sommer',
	winter: 'Winter',
	yearly: 'Ganzjährig',
} as const;

export function TrainingCard({ training }: Readonly<TrainingCardProps>) {
	const weekdayLabel = WEEKDAY_LABELS[training.weekday];
	const seasonLabel = SEASON_LABELS[training.season];

	if (!training.venue.location) return null;

	return (
		<Card className="relative w-full max-w-xl overflow-hidden">
			<div
				className={cn(
					'absolute right-5 top-5 flex items-center gap-3 rounded-full px-2 py-1 font-medium',
					{ 'bg-amber-100 text-amber-800': training.season === 'summer' },
					{ 'bg-blue-100 text-blue-800': training.season === 'winter' },
					{ 'bg-primary-light text-primary-foreground': training.season === 'yearly' },
				)}
			>
				{training.season === 'summer' && <Sun className="size-5 text-amber-800" />}
				{training.season === 'winter' && <CloudSnow className="size-5 text-blue-800" />}
				<span>{seasonLabel}</span>
			</div>

			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-3xl">
					<Calendar className="text-primary size-8" />
					{weekdayLabel}
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-3">
				<div className="flex items-center gap-2 text-xl">
					<Clock className="text-primary mr-1 size-6" />
					<span>
						{training.startTime} - {training.endTime} Uhr
					</span>
				</div>

				{training.venue.location && (
					<div className="flex items-start gap-2 text-xl">
						<MapPin className="text-primary mr-1 size-6" />
						<div>
							<div className="font-bold">{training.venue.title}</div>
							<div className="text-muted-foreground">
								{training.venue.location?.street} {training.venue.location?.houseNumber}
							</div>
							<div className="text-muted-foreground">
								{training.venue.location?.zipCode} {training.venue.location?.city}
							</div>
						</div>
					</div>
				)}

				<CardDescription className="mt-10 text-sm">
					{training.note}
					<Button title="Google Maps wird in einem neuem Tab geöffnet" variant="secondary" asChild>
						<ExternalLink href={printGoogleMapsLink(training.venue.location)}>
							Route auf Google Maps berechnen
						</ExternalLink>
					</Button>
				</CardDescription>
			</CardContent>
		</Card>
	);
}
