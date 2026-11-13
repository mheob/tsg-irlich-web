import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import volunteerPage from './index';

interface PageField {
	fields?: PageField[];
	group?: string;
	initialValue?: unknown;
	name: string;
	of?: { fields?: PageField[]; to?: { type: string }[]; type?: string }[];
	options?: { list?: unknown };
	readOnly?: boolean;
	type: string;
	validation?: (rule: unknown) => unknown;
}

type Check = (value?: unknown) => unknown;

const fields = volunteerPage.fields as unknown as PageField[];

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

function itemField(array: PageField, name: string): PageField {
	const found = array.of?.[0]?.fields?.find((candidate) => candidate.name === name);

	if (!found) {
		throw new Error(`Missing item field ${array.name}.${name}`);
	}

	return found;
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

const reasons = subField(section('whySection'), 'reasons');
const areas = subField(section('areasSection'), 'areas');
const steps = subField(section('positionsSection'), 'steps');

describe('volunteer page', () => {
	it('fixes its slug to ehrenamt', () => {
		expect(field('slug')).toMatchObject({ initialValue: { current: 'ehrenamt' }, readOnly: true });
	});

	it('lists its tabs as Allgemein, Inhalt, Anfragen, SEO & Teilen', () => {
		expect(volunteerPage.groups.map(({ name }) => name)).toStrictEqual([
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

	it('splits the content into five sections, each in its own tab', () => {
		expect(field('content').fields?.map(({ group, name }) => [name, group])).toStrictEqual([
			['whySection', 'why'],
			['voicesSection', 'voices'],
			['areasSection', 'areas'],
			['positionsSection', 'positions'],
			['contactPersonsSection', 'contactPersons'],
		]);
	});

	it('presets the inquiry address and subject', () => {
		expect(subField(field('inquiry'), 'email')).toMatchObject({
			initialValue: 'info@tsg-irlich.de',
			type: 'email',
		});
		expect(subField(field('inquiry'), 'subject')).toMatchObject({
			initialValue: 'Ehrenamt bei der TSG Irlich',
		});
	});

	it('warns while the reasons do not fill the grid of six', () => {
		const check = customCheck(reasons);

		expect(check?.([{}, {}, {}, {}, {}])).toBe('Das Raster ist für 6 Karten gebaut.');
		expect(check?.([{}, {}, {}, {}, {}, {}, {}])).toBe('Das Raster ist für 6 Karten gebaut.');
		expect(check?.([{}, {}, {}, {}, {}, {}])).toBe(true);
		expect(check?.()).toBe(true);
	});

	it('warns while the steps are not three', () => {
		const check = customCheck(steps);

		expect(check?.([{}, {}])).toBe('Der Ablauf ist für 3 Schritte gebaut.');
		expect(check?.([{}, {}, {}])).toBe(true);
		expect(check?.()).toBe(true);
	});

	it('takes any number of areas', () => {
		expect(customCheck(areas)).toBeUndefined();
	});

	it('offers the shared icon list on every reason and area', () => {
		expect(itemField(reasons, 'icon').options?.list).toStrictEqual(PAGE_ICONS);
		expect(itemField(areas, 'icon').options?.list).toStrictEqual(PAGE_ICONS);
	});

	it('asks for an image with alt text on every area', () => {
		expect(itemField(areas, 'image').type).toBe('extendedImage');
	});

	// An image object that only carries an alt text would pass `required()` alone.
	it('asks for the image file of every area, not only its alt text', () => {
		expect(recordedRuleCalls(itemField(areas, 'image'))).toContain('assetRequired');
	});

	it('quotes testimonials as voices', () => {
		expect(subField(section('voicesSection'), 'testimonials').of).toStrictEqual([
			expect.objectContaining({ to: [{ type: 'testimonial' }], type: 'reference' }),
		]);
	});

	it.each([
		['tasksHeading', 'Deine Aufgaben'],
		['profileHeading', 'Das bringst du mit'],
		['offerHeading', 'Das bieten wir'],
		['cta', 'Jetzt melden'],
	])('presets %s of the open positions with „%s“', (name, initialValue) => {
		expect(subField(section('positionsSection'), name)).toMatchObject({ initialValue });
	});

	it('shows a fixed title in lists', () => {
		expect(volunteerPage.preview.prepare()).toStrictEqual({ title: 'Ehrenamt' });
	});

	it.each([
		['the content', () => field('content')],
		['the inquiry', () => field('inquiry')],
		['the inquiry address', () => subField(field('inquiry'), 'email')],
		['the inquiry subject', () => subField(field('inquiry'), 'subject')],
		['the title of a reason', () => itemField(reasons, 'title')],
		['the text of a reason', () => itemField(reasons, 'text')],
		['the icon of a reason', () => itemField(reasons, 'icon')],
		['the image of an area', () => itemField(areas, 'image')],
		['the title of a step', () => itemField(steps, 'title')],
		['the button of the open positions', () => subField(section('positionsSection'), 'cta')],
		[
			'a heading of the open positions',
			() => subField(section('positionsSection'), 'tasksHeading'),
		],
	])('requires %s', (_name, target) => {
		expect(recordedRuleCalls(target())).toContain('required');
	});

	it.each([
		['the button of the reasons', () => subField(section('whySection'), 'cta')],
		['the card for own ideas', () => subField(section('positionsSection'), 'otherTitle')],
		['the voices', () => subField(section('voicesSection'), 'testimonials')],
	])('lets %s stay empty', (_name, target) => {
		expect(recordedRuleCalls(target())).not.toContain('required');
	});
});
