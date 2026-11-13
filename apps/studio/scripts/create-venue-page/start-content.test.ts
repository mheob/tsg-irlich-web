// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { BOARD_IDS } from '../shared/board';
import {
	buildStartContent,
	HOME_VENUE_IDS,
	resolveStartVenues,
	VENUE_PAGE_ID,
} from './start-content';

const STADIUM_ID = '2f1440fa-d543-427b-8792-d891e29000d8';
const CLUBHOUSE_ID = '968c56f9-7a9c-462f-be2b-8f269075b007';

const STADIUM_IMAGE = {
	_type: 'extendedImage',
	alt: 'Das Pappelstadion von oben',
	asset: { _ref: 'image-stadium-4000x2250-jpg', _type: 'reference' as const },
};

function keyOf(item: unknown): string[] {
	return typeof item === 'object' &&
		item !== null &&
		'_key' in item &&
		typeof item._key === 'string'
		? [item._key]
		: [];
}

describe('venue page start content', () => {
	const draft = buildStartContent(STADIUM_IMAGE);
	const { contactPersonsSection, homeSection, othersSection } = draft.content;

	it('writes the draft of the singleton', () => {
		expect(draft).toMatchObject({ _id: VENUE_PAGE_ID, _type: 'venuePage' });
		expect(VENUE_PAGE_ID).toBe('drafts.venuePage');
	});

	it('takes the hero texts of the prototype and fixes the slug', () => {
		expect(draft).toMatchObject({
			slug: { _type: 'slug', current: 'sportstaetten' },
			subtitle: 'Hier spielt die TSG',
			title: 'Sportstätten',
		});
	});

	it('heads the home section like the prototype', () => {
		expect(homeSection).toMatchObject({
			subtitle: 'Unsere Heimat',
			title: 'Pappelstadion & Pappelstübchen',
		});
	});

	it('picks Pappelstadion and Pappelstübchen as home venues, in that order', () => {
		expect(HOME_VENUE_IDS).toStrictEqual([STADIUM_ID, CLUBHOUSE_ID]);
		expect(homeSection.venues.map(({ _ref, _type }) => [_ref, _type])).toStrictEqual([
			[STADIUM_ID, 'reference'],
			[CLUBHOUSE_ID, 'reference'],
		]);
	});

	it('fills the turf box with its link text', () => {
		expect(homeSection.turfBox).toMatchObject({
			linkText: 'Sprich uns an, wenn du helfen willst',
			title: 'Unser Traum: Kunstrasen',
		});
	});

	it('heads the other venues like the prototype', () => {
		expect(othersSection).toMatchObject({
			subtitle: 'Alle weiteren Sportanlagen',
			title: 'Hier sind wir außerdem aktiv',
		});
	});

	it('names the board as contact persons, in order', () => {
		expect(contactPersonsSection.contactPersons.map(({ _ref }) => _ref)).toStrictEqual([
			...BOARD_IDS,
		]);
	});

	it('gives every array item a unique key', () => {
		const keys = [...homeSection.venues, ...contactPersonsSection.contactPersons].flatMap((item) =>
			keyOf(item),
		);

		expect(new Set(keys).size).toBe(keys.length);
		expect(keys).toHaveLength(homeSection.venues.length + BOARD_IDS.length);
	});

	it('presets the inquiry', () => {
		expect(draft.inquiry).toStrictEqual({
			email: 'info@tsg-irlich.de',
			subject: 'Frage zu den Sportstätten der TSG Irlich',
		});
	});

	it('takes the given image as hero image', () => {
		expect(draft.heroImage).toStrictEqual(STADIUM_IMAGE);
	});

	it('leaves the hero image out without an image', () => {
		expect(buildStartContent()).not.toHaveProperty('heroImage');
	});

	it('offers nothing to rent', () => {
		expect(JSON.stringify(draft)).not.toMatch(/miet/iu);
	});
});

describe('start venues', () => {
	it('takes the image of the Pappelstadion as hero image', () => {
		const result = resolveStartVenues([
			{ _id: CLUBHOUSE_ID, mainImage: null },
			{ _id: STADIUM_ID, mainImage: STADIUM_IMAGE },
		]);

		expect(result).toStrictEqual({ heroImage: STADIUM_IMAGE });
	});

	it('writes no hero image when the Pappelstadion has none', () => {
		const result = resolveStartVenues([
			{ _id: STADIUM_ID, mainImage: null },
			{ _id: CLUBHOUSE_ID, mainImage: null },
		]);

		expect(result).toStrictEqual({ heroImage: undefined });
	});

	it('refuses when a home venue is missing', () => {
		expect(resolveStartVenues([{ _id: STADIUM_ID, mainImage: STADIUM_IMAGE }])).toBeUndefined();
	});
});
