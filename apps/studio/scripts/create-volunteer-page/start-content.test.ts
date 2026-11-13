// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import {
	assertPlaceholdersAllowed,
	buildPlaceholderPositions,
	buildStartContent,
	hasPlaceholderFlag,
	toStartImages,
	VOLUNTEER_PAGE_ID,
} from './start-content';

function image(name: string) {
	return {
		_type: 'image',
		asset: { _ref: `image-${name}-1200x900-jpg`, _type: 'reference' as const },
		hotspot: { height: 0.5, width: 0.5, x: 0.5, y: 0.5 },
	};
}

const HERO_IMAGE = { ...image('hero'), _type: 'extendedImage' };
const AREA_IMAGES = [image('team'), image('youth'), undefined, image('vision')];

const ICON_VALUES = new Set<string>(PAGE_ICONS.map(({ value }) => value));

const BOARD_IDS = [
	'2e62c3c7-6d23-4799-9701-a08256d0c1b2',
	'429f8069-7868-4fef-96ca-cfb9d88f68a3',
	'51dfa04b-7577-48d0-9434-a096e0b3ff42',
	'b9c684aa-f914-4c32-8619-fde519d41315',
];

function keyOf(item: unknown): string[] {
	return typeof item === 'object' &&
		item !== null &&
		'_key' in item &&
		typeof item._key === 'string'
		? [item._key]
		: [];
}

/**
 * Collects every `_key` of the arrays in a document, so a test can check them for uniqueness.
 *
 * @param value - The document or a part of it.
 * @returns The keys found, in document order.
 */
function collectKeys(value: unknown): string[] {
	if (Array.isArray(value)) {
		const keys: string[] = [];
		for (const item of value as unknown[]) {
			keys.push(...keyOf(item), ...collectKeys(item));
		}
		return keys;
	}

	if (typeof value === 'object' && value !== null) {
		return Object.values(value).flatMap((child) => collectKeys(child));
	}

	return [];
}

describe('the start content of the volunteer page', () => {
	const page = buildStartContent({ areaImages: AREA_IMAGES, heroImage: HERO_IMAGE });
	const { areasSection, contactPersonsSection, positionsSection, voicesSection, whySection } =
		page.content;

	it('is a draft of the singleton with the fixed slug', () => {
		expect(VOLUNTEER_PAGE_ID).toBe('drafts.volunteerPage');
		expect(page).toMatchObject({
			_id: 'drafts.volunteerPage',
			_type: 'volunteerPage',
			slug: { _type: 'slug', current: 'ehrenamt' },
			subtitle: 'Ehrenamt bei der TSG',
			title: 'Engagiere dich',
		});
	});

	it('has the six reasons of the prototype in order', () => {
		expect(whySection.reasons.map(({ title }) => title)).toStrictEqual([
			'Gemeinschaft',
			'Persönliche Entwicklung',
			'Sinn stiften',
			'Sport fördern',
			'Ideen einbringen',
			'Wertschätzung',
		]);
		expect(whySection.cta).toBe('Offene Aufgaben ansehen');
	});

	it('has the four areas of the prototype in order', () => {
		expect(areasSection.areas.map(({ title }) => title)).toStrictEqual([
			'Sport & Mannschaften',
			'Schiedsrichter & Spielbetrieb',
			'Verein & Organisation',
			'Veranstaltungen & Helfer',
		]);
	});

	it('has the three steps of the prototype', () => {
		expect(positionsSection.steps.map(({ title }) => title)).toStrictEqual([
			'Melde dich',
			'Lerne uns kennen',
			'Leg los',
		]);
	});

	it('presets the texts every open position shows', () => {
		expect(positionsSection).toMatchObject({
			cta: 'Jetzt melden',
			offerHeading: 'Das bieten wir',
			otherText: 'Erzähl uns, was du dir vorstellen kannst – wir finden etwas für dich.',
			otherTitle: 'Nichts Passendes dabei?',
			profileHeading: 'Das bringst du mit',
			tasksHeading: 'Deine Aufgaben',
		});
	});

	it('only uses icons of the shared list', () => {
		for (const { icon } of [...whySection.reasons, ...areasSection.areas]) {
			expect(ICON_VALUES.has(icon)).toBe(true);
		}
	});

	it('gives every array item a unique key', () => {
		const keys = collectKeys(page);

		expect(keys.length).toBeGreaterThan(0);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('lists the board as contact persons, in order', () => {
		expect(contactPersonsSection.contactPersons.map(({ _ref }) => _ref)).toStrictEqual(BOARD_IDS);
	});

	it('starts without voices, since nobody has agreed to be quoted yet', () => {
		expect(voicesSection).not.toHaveProperty('testimonials');
	});

	it('presets the inquiry', () => {
		expect(page.inquiry).toStrictEqual({
			email: 'info@tsg-irlich.de',
			subject: 'Ehrenamt bei der TSG Irlich',
		});
	});

	it('gives each area its image with the area title as alt text', () => {
		expect(areasSection.areas[0]?.image).toStrictEqual({
			...image('team'),
			_type: 'extendedImage',
			alt: 'Sport & Mannschaften',
		});
	});

	it('leaves the image out of an area without one', () => {
		expect(areasSection.areas[2]).not.toHaveProperty('image');
	});

	it('takes the hero image as given and leaves it out without one', () => {
		expect(page.heroImage).toStrictEqual(HERO_IMAGE);
		expect(buildStartContent({ areaImages: [] })).not.toHaveProperty('heroImage');
	});
});

describe('the placeholder positions', () => {
	const positions = buildPlaceholderPositions();

	it('are the four drafts of the prototype', () => {
		expect(positions.map(({ _id, title }) => [_id, title])).toStrictEqual([
			['drafts.volunteer-position-placeholder-1', 'Übungsleiter/in Kinderturnen'],
			['drafts.volunteer-position-placeholder-2', 'Co-Trainer/in F-Jugend'],
			['drafts.volunteer-position-placeholder-3', 'Schiedsrichter/in'],
			['drafts.volunteer-position-placeholder-4', 'Unterstützung im Vorstand'],
		]);
	});

	it('carry every field of a position', () => {
		expect(positions[1]).toMatchObject({
			_type: 'volunteer.position',
			area: 'Fußball',
			effort: '2× pro Woche + Spieltage',
			offer: ['Einstieg ins Trainerteam', 'Trainerlehrgänge', 'Teamkleidung'],
			profile: ['Spaß am Fußball', 'Geduld mit Kindern', 'Zeit am Wochenende'],
			tasks: ['Training mitgestalten', 'Kinder zu Spielen begleiten', 'Eltern als Ansprechpartner'],
		});
	});
});

describe('the placeholder flag', () => {
	it('is set by --with-placeholder-positions', () => {
		expect(
			hasPlaceholderFlag(['--', '--dataset', 'development', '--with-placeholder-positions']),
		).toBe(true);
	});

	it('is not set without it', () => {
		expect(hasPlaceholderFlag(['--', '--dataset', 'development'])).toBe(false);
	});
});

describe('the start images', () => {
	it('takes the group images, the fallback and the first vision image in the order of the areas', () => {
		const images = toStartImages({
			groups: [
				{ featuredImage: image('youth'), slug: 'a-jugend' },
				{ featuredImage: image('team'), slug: '1-mannschaft' },
			],
			heroImage: HERO_IMAGE,
			site: { fallbackImage: image('fallback'), vision: image('vision') },
		});

		expect(images).toStrictEqual({
			areaImages: [image('team'), image('youth'), image('fallback'), image('vision')],
			heroImage: HERO_IMAGE,
		});
	});

	it('leaves a place empty where an image is missing', () => {
		expect(
			toStartImages({
				groups: [{ featuredImage: null, slug: '1-mannschaft' }],
				heroImage: null,
				site: null,
			}),
		).toStrictEqual({ areaImages: [undefined, undefined, undefined, undefined] });
	});
});

describe('the placeholder guard', () => {
	it('refuses placeholders for production', () => {
		expect(() => {
			assertPlaceholdersAllowed('production', true);
		}).toThrow('Platzhalter-Aufgaben gehören nicht nach production.');
	});

	it('lets placeholders go to development and production go without them', () => {
		expect(() => {
			assertPlaceholdersAllowed('development', true);
		}).not.toThrow();
		expect(() => {
			assertPlaceholdersAllowed('production', false);
		}).not.toThrow();
	});
});
