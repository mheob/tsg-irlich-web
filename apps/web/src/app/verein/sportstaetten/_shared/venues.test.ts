import { describe, expect, it } from 'vite-plus/test';

import type { Venue, VenueLocation } from './types';
import {
	getAddressLines,
	getDetailsTitle,
	getGroupHref,
	getTrainingDays,
	getTypeLabel,
	splitOtherVenues,
	WEEKDAYS,
} from './venues';

function venue(overrides: Partial<Venue> = {}): Venue {
	return {
		_id: 'venue-1',
		description: null,
		features: null,
		groups: [],
		location: {
			city: 'Neuwied',
			houseNumber: '20',
			name: 'Pappelstadion Neuwied/Irlich',
			street: 'Gotenstraße',
			zipCode: '56567',
		},
		mainImage: null,
		openingHours: null,
		title: 'Pappelstadion',
		type: 'cinder',
		...overrides,
	};
}

function group(overrides: Partial<TestGroup> = {}): TestGroup {
	return {
		_id: 'group-1',
		department: 'fussball',
		slug: '1-mannschaft',
		title: '1. Mannschaft',
		weekdays: ['monday'],
		...overrides,
	};
}

/** A group as the helpers read it: a weekday and a department slug can be missing at runtime. */
interface TestGroup {
	_id: string;
	department: null | string;
	slug: string;
	title: string;
	weekdays: (null | string)[];
}

describe('venue type labels', () => {
	it.each([
		['hall-1', 'Einfeldhalle'],
		['hall-2', 'Zweifeldhalle'],
		['hall-3', 'Dreifeldhalle'],
		['cinder', 'Aschenplatz'],
		['grass', 'Rasenplatz'],
		['hybrid', 'Hybridrasenplatz'],
		['artificial-turf', 'Kunstrasenplatz'],
		['clubhouse', 'Vereinsheim'],
	] as const)('names %s „%s“', (type, label) => {
		expect(getTypeLabel(type)).toBe(label);
	});

	it.each([
		['hall-2', 'Das bietet die Halle'],
		['clubhouse', 'Das bietet das Vereinsheim'],
		['grass', 'Das bietet der Platz'],
	] as const)('heads the details of %s with „%s“', (type, title) => {
		expect(getDetailsTitle(type)).toBe(title);
	});
});

describe('training days', () => {
	it('collects the weekdays of every group once', () => {
		const days = getTrainingDays({
			groups: [
				group({ weekdays: ['monday', 'monday'] }),
				group({ _id: 'group-2', weekdays: ['wednesday'] }),
			],
		});

		expect([...days].toSorted()).toStrictEqual(['monday', 'wednesday']);
	});

	it('ignores a training time without a weekday', () => {
		const days = getTrainingDays({ groups: [group({ weekdays: [null] })] });

		expect(days.size).toBe(0);
	});

	it('names the seven weekdays from Monday to Sunday', () => {
		expect(WEEKDAYS.map(({ label }) => label)).toStrictEqual([
			'Mo',
			'Di',
			'Mi',
			'Do',
			'Fr',
			'Sa',
			'So',
		]);
		expect(WEEKDAYS[0]).toMatchObject({ key: 'monday', name: 'Montag' });
	});
});

describe('group links', () => {
	it('links a group to its page below its department', () => {
		expect(getGroupHref(group())).toBe('/angebot/fussball/1-mannschaft');
	});

	it('links no group without a department', () => {
		expect(getGroupHref(group({ department: null }))).toBeUndefined();
	});
});

describe('address lines', () => {
	const location: VenueLocation = {
		city: 'Neuwied',
		houseNumber: '20',
		name: 'Pappelstadion Neuwied/Irlich',
		street: 'Gotenstraße',
		zipCode: '56567',
	};

	it('builds the street line and the city line', () => {
		expect(getAddressLines(location)).toStrictEqual(['Gotenstraße 20', '56567 Neuwied']);
	});

	it('leaves out a missing zip code', () => {
		expect(getAddressLines({ ...location, zipCode: undefined })?.[1]).toBe('Neuwied');
	});

	it('returns no lines without a location', () => {
		expect(getAddressLines(null)).toBeUndefined();
	});
});

describe('other venues', () => {
	const stadium = venue({ _id: 'stadium', type: 'cinder' });
	const clubhouse = venue({ _id: 'clubhouse', type: 'clubhouse' });
	const hall = venue({ _id: 'hall', title: 'Mehrzweckhalle Irlich', type: 'hall-1' });
	const field = venue({ _id: 'field', title: 'Sportplatz Hüllenberg', type: 'grass' });

	it('splits the venues that are not home venues into halls and fields', () => {
		const result = splitOtherVenues(
			[stadium, clubhouse, hall, field],
			new Set(['stadium', 'clubhouse']),
		);

		expect(result.halls.map(({ _id }) => _id)).toStrictEqual(['hall']);
		expect(result.fields.map(({ _id }) => _id)).toStrictEqual(['field']);
	});

	it('leaves out a clubhouse that is no home venue', () => {
		const result = splitOtherVenues([clubhouse, hall], new Set());

		expect(result.halls.map(({ _id }) => _id)).toStrictEqual(['hall']);
		expect(result.fields).toStrictEqual([]);
	});

	it('keeps the order it is given', () => {
		const second = venue({ _id: 'hall-2', title: 'Turnhalle Niederbieber', type: 'hall-3' });
		const result = splitOtherVenues([second, hall], new Set());

		expect(result.halls.map(({ _id }) => _id)).toStrictEqual(['hall-2', 'hall']);
	});
});
