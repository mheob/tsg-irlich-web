import { describe, expect, it } from 'vite-plus/test';

import venuePage from './index';

interface PageField {
	fields?: PageField[];
	group?: string;
	initialValue?: unknown;
	name: string;
	of?: { fields?: PageField[]; to?: { type: string }[]; type?: string }[];
	readOnly?: boolean;
	type: string;
	validation?: (rule: unknown) => unknown;
}

type Check = (value?: unknown, context?: unknown) => unknown;

const fields = venuePage.fields as unknown as PageField[];

function field(name: string): PageField {
	const found = fields.find((candidate) => candidate.name === name);

	if (!found) {
		throw new Error(`Missing field ${name}`);
	}

	return found;
}

function subField(parent: PageField, name: string): PageField {
	const found = parent.fields?.find((candidate) => candidate.name === name);

	if (!found) {
		throw new Error(`Missing field ${parent.name}.${name}`);
	}

	return found;
}

function section(name: string): PageField {
	return subField(field('content'), name);
}

// Runs the validation of a field against a fake rule and hands back its `Rule.custom` predicate.
function customCheck(target: PageField): Check | undefined {
	let check: Check | undefined;
	const rule = {
		custom: (predicate: Check) => {
			check = predicate;

			return rule;
		},
		error: () => rule,
		max: () => rule,
		required: () => rule,
		warning: () => rule,
	};

	target.validation?.(rule);

	return check;
}

/**
 * Runs the validation of a field against a rule that records the name of every method called on
 * it, so a test can tell whether the field is required.
 *
 * @param target - The field.
 * @returns The names of the called rule methods.
 */
function recordedRuleCalls(target: PageField): string[] {
	const calls: string[] = [];
	const rule: object = new Proxy(
		{},
		{
			get:
				(_target, property) =>
				(..._args: unknown[]) => {
					calls.push(String(property));
					return rule;
				},
		},
	);
	target.validation?.(rule);

	return calls;
}

const venues = subField(section('homeSection'), 'venues');
const turfBox = subField(section('homeSection'), 'turfBox');
const linkText = subField(turfBox, 'linkText');

const ONE_VENUE = 'Wähle genau zwei Sportstätten.';
const DUPLICATE = 'Jede Sportstätte nur einmal.';
const LINK_TEXT_MISSING =
	'Der Linktext ist erforderlich, sobald der Kasten einen Titel oder Text hat.';

describe('venue page', () => {
	it('fixes its slug to sportstaetten', () => {
		expect(field('slug')).toMatchObject({
			initialValue: { current: 'sportstaetten' },
			readOnly: true,
		});
	});

	it('lists its tabs as Allgemein, Inhalt, Anfragen, SEO & Teilen', () => {
		expect(venuePage.groups.map(({ name }) => name)).toStrictEqual([
			'general',
			'content',
			'inquiry',
			'meta',
		]);
	});

	it('offers the hero, the content, the inquiry and the meta fields', () => {
		expect(fields.map(({ name }) => name)).toStrictEqual([
			'slug',
			'title',
			'subtitle',
			'heroImage',
			'content',
			'inquiry',
			'meta',
		]);
	});

	it('splits the content into three sections, each in its own tab', () => {
		expect(field('content').fields?.map(({ group, name }) => [name, group])).toStrictEqual([
			['homeSection', 'home'],
			['othersSection', 'others'],
			['contactPersonsSection', 'contactPersons'],
		]);
	});

	it('presets the inquiry address and subject', () => {
		expect(subField(field('inquiry'), 'email')).toMatchObject({
			initialValue: 'info@tsg-irlich.de',
			type: 'email',
		});
		expect(subField(field('inquiry'), 'subject')).toMatchObject({
			initialValue: 'Frage zu den Sportstätten der TSG Irlich',
		});
	});

	it('picks the home venues by reference', () => {
		expect(venues.of).toStrictEqual([
			expect.objectContaining({ to: [{ type: 'venue' }], type: 'reference' }),
		]);
	});

	it('requires the home venues', () => {
		expect(recordedRuleCalls(venues)).toContain('required');
	});

	it('asks for exactly two home venues', () => {
		const check = customCheck(venues);

		expect(check?.([{ _ref: 'a' }])).toBe(ONE_VENUE);
		expect(check?.([{ _ref: 'a' }, { _ref: 'b' }, { _ref: 'c' }])).toBe(ONE_VENUE);
		expect(check?.([{ _ref: 'a' }, { _ref: 'b' }])).toBe(true);
	});

	it('refuses the same home venue twice', () => {
		expect(customCheck(venues)?.([{ _ref: 'a' }, { _ref: 'a' }])).toBe(DUPLICATE);
	});

	it('leaves a missing list to the required rule', () => {
		expect(customCheck(venues)?.()).toBe(true);
	});

	it('offers title, text and link text in the turf box', () => {
		expect(turfBox.fields?.map(({ name }) => name)).toStrictEqual(['title', 'text', 'linkText']);
	});

	it('lets the turf box stay empty', () => {
		expect(recordedRuleCalls(turfBox)).not.toContain('required');
		expect(customCheck(linkText)?.(undefined, { parent: {} })).toBe(true);
		expect(customCheck(linkText)?.(undefined, {})).toBe(true);
	});

	it('asks for the link text once the turf box has a title or a text', () => {
		const check = customCheck(linkText);

		expect(check?.(undefined, { parent: { title: 'Unser Traum: Kunstrasen' } })).toBe(
			LINK_TEXT_MISSING,
		);
		expect(check?.('', { parent: { text: 'Seit vielen Jahren …' } })).toBe(LINK_TEXT_MISSING);
		expect(check?.('Sprich uns an', { parent: { title: 'Unser Traum: Kunstrasen' } })).toBe(true);
	});

	it('shows a fixed title in lists', () => {
		expect(venuePage.preview.prepare()).toStrictEqual({ title: 'Sportstätten' });
	});

	it.each([
		['the content', () => field('content')],
		['the inquiry', () => field('inquiry')],
		['the inquiry address', () => subField(field('inquiry'), 'email')],
		['the inquiry subject', () => subField(field('inquiry'), 'subject')],
	])('requires %s', (_name, target) => {
		expect(recordedRuleCalls(target())).toContain('required');
	});
});
