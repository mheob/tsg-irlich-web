import { getInternalHref } from '@/utils/links';

import type { Venue, VenueLocation, VenueType } from './types';

/** The seven weekdays, as the training days of a venue show them. */
const WEEKDAYS = [
	{ key: 'monday', label: 'Mo', name: 'Montag' },
	{ key: 'tuesday', label: 'Di', name: 'Dienstag' },
	{ key: 'wednesday', label: 'Mi', name: 'Mittwoch' },
	{ key: 'thursday', label: 'Do', name: 'Donnerstag' },
	{ key: 'friday', label: 'Fr', name: 'Freitag' },
	{ key: 'saturday', label: 'Sa', name: 'Samstag' },
	{ key: 'sunday', label: 'So', name: 'Sonntag' },
] as const;

const TYPE_LABELS: Record<VenueType, string> = {
	'artificial-turf': 'Kunstrasenplatz',
	cinder: 'Aschenplatz',
	clubhouse: 'Vereinsheim',
	grass: 'Rasenplatz',
	'hall-1': 'Einfeldhalle',
	'hall-2': 'Zweifeldhalle',
	'hall-3': 'Dreifeldhalle',
	hybrid: 'Hybridrasenplatz',
};

const HALL_PREFIX = 'hall-';

/**
 * Names the kind of a venue, as the page shows it above the name and on a card.
 *
 * @param type - The type of the venue.
 * @returns The German label.
 */
function getTypeLabel(type: VenueType): string {
	return TYPE_LABELS[type];
}

/**
 * Heads the equipment of a venue after its kind, since „Das bietet der Platz“ reads wrong above a
 * hall.
 *
 * @param type - The type of the venue.
 * @returns The heading of the equipment column.
 */
function getDetailsTitle(type: VenueType): string {
	if (type.startsWith(HALL_PREFIX)) {
		return 'Das bietet die Halle';
	}

	return type === 'clubhouse' ? 'Das bietet das Vereinsheim' : 'Das bietet der Platz';
}

/**
 * Collects the weekdays on which somebody trains at a venue. A group that trains there twice a
 * week names its day twice, so the days are a set.
 *
 * A training time written through the API may carry no weekday, so an empty day is dropped.
 *
 * @param venue - The venue with its groups.
 * @returns The weekdays, as the keys of `WEEKDAYS`.
 */
function getTrainingDays(venue: { groups: readonly GroupDays[] }): Set<string> {
	return new Set(
		venue.groups.flatMap((group) => (group.weekdays ?? []).filter((day) => day !== null)),
	);
}

/**
 * Builds the path of the page of a group that trains at a venue.
 *
 * @param group - The group.
 * @returns The path, or `undefined` while the group has no page.
 */
function getGroupHref(group: GroupPath): string | undefined {
	return getInternalHref({
		_type: 'group',
		department: group.department,
		slug: group.slug,
	});
}

/**
 * Splits the address of a venue into the two lines the page prints.
 *
 * @param location - The location of the venue.
 * @returns The street line and the city line, or `undefined` without a location.
 */
function getAddressLines(location: VenueLocation): [string, string] | undefined {
	if (!location) {
		return undefined;
	}

	const { city, houseNumber, street, zipCode } = location;

	return [`${street} ${houseNumber}`, [zipCode, city].filter(Boolean).join(' ')];
}

/**
 * Splits the venues that are not shown as home venues into halls and fields, in the order they
 * come in. A clubhouse outside the home section belongs to neither and is left out.
 *
 * @param venues - Every venue of the dataset.
 * @param homeIds - The ids of the venues the home section shows.
 * @returns The halls and the fields.
 */
function splitOtherVenues(
	venues: readonly Venue[],
	homeIds: ReadonlySet<string>,
): { fields: Venue[]; halls: Venue[] } {
	const others = venues.filter((venue) => !homeIds.has(venue._id));

	return {
		fields: others.filter(
			(venue) => !venue.type.startsWith(HALL_PREFIX) && venue.type !== 'clubhouse',
		),
		halls: others.filter((venue) => venue.type.startsWith(HALL_PREFIX)),
	};
}

/** What `getTrainingDays` reads of a group: the days it trains at this venue, if it names any. */
interface GroupDays {
	weekdays?: readonly (null | string)[] | null;
}

/** What `getGroupHref` reads of a group. A group whose department has no slug has no page. */
interface GroupPath {
	department?: null | string;
	slug: string;
}

export {
	getAddressLines,
	getDetailsTitle,
	getGroupHref,
	getTrainingDays,
	getTypeLabel,
	splitOtherVenues,
	WEEKDAYS,
};
