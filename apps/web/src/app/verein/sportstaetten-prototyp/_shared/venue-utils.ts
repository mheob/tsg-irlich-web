// PROTOTYPE (WEB-149) — small helpers both variants share.

import { getInternalHref } from '@/utils/links';

import type { Venue, VenueGroup } from './data';

const TYPE_LABELS: Record<Venue['type'], string> = {
	'artificial-turf': 'Kunstrasenplatz',
	cinder: 'Aschenplatz',
	grass: 'Rasenplatz',
	'hall-1': 'Einfeldhalle',
	'hall-2': 'Zweifeldhalle',
	'hall-3': 'Dreifeldhalle',
	hybrid: 'Hybridrasenplatz',
};

const WEEKDAYS = [
	{ key: 'monday', label: 'Mo', name: 'Montag' },
	{ key: 'tuesday', label: 'Di', name: 'Dienstag' },
	{ key: 'wednesday', label: 'Mi', name: 'Mittwoch' },
	{ key: 'thursday', label: 'Do', name: 'Donnerstag' },
	{ key: 'friday', label: 'Fr', name: 'Freitag' },
	{ key: 'saturday', label: 'Sa', name: 'Samstag' },
	{ key: 'sunday', label: 'So', name: 'Sonntag' },
] as const;

// The clubhouse is stored as "Aschenplatz" in Sanity; the real page needs its own type for it.
function getTypeLabel(venue: Venue, override?: string): string {
	return override ?? TYPE_LABELS[venue.type];
}

function getTrainingDays(venue: Venue): Set<string> {
	return new Set(venue.groups.flatMap((group) => group.times.map((time) => time.weekday)));
}

function getGroupHref(group: VenueGroup): string | undefined {
	return getInternalHref({
		_type: 'group',
		department: group.department ?? undefined,
		slug: group.slug,
	});
}

function getAddressLines(venue: Venue): [string, string] | undefined {
	if (!venue.location) {
		return undefined;
	}
	const { city, houseNumber, street, zipCode } = venue.location;
	return [`${street} ${houseNumber}`, [zipCode, city].filter(Boolean).join(' ')];
}

export { getAddressLines, getGroupHref, getTrainingDays, getTypeLabel, WEEKDAYS };
