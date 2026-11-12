import { describe, expect, it } from 'vite-plus/test';

import { PARTNER_ICONS } from '@tsgi-web/shared/partner-icons';

import partnerPage from './index';

interface PageField {
	fields?: PageField[];
	group?: string;
	initialValue?: unknown;
	name: string;
	of?: { fields: PageField[] }[];
	options?: { list?: unknown };
	readOnly?: boolean;
	type: string;
	validation?: (rule: unknown) => unknown;
}

type Check = (value?: unknown) => unknown;

const fields = partnerPage.fields as unknown as PageField[];

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

function inquiryField(name: string): PageField {
	return subField(field('inquiry'), name);
}

// The card array of a section: `reasons` sits in `whySection`, `ways` in `waysSection`.
function cards(name: string): PageField {
	const section = name === 'reasons' ? 'whySection' : 'waysSection';

	return subField(subField(field('content'), section), name);
}

function cardField(arrayName: string, name: string): PageField {
	const card = cards(arrayName).of?.[0];
	const found = card?.fields.find((candidate) => candidate.name === name);

	if (!found) {
		throw new Error(`Missing card field ${arrayName}.${name}`);
	}

	return found;
}

// Runs the validation of a field against a fake rule and hands back the `Rule.custom` predicate.
function cardsValidation(name: string): Check {
	let check: Check | undefined;
	const rule = {
		custom: (predicate: Check) => {
			check = predicate;

			return rule;
		},
		error: () => rule,
		required: () => rule,
		warning: () => rule,
	};

	cards(name).validation?.(rule);

	if (!check) {
		throw new Error(`No custom check on ${name}`);
	}

	return check;
}

describe('partner page', () => {
	it('fixes its slug to partner', () => {
		expect(field('slug')).toMatchObject({ initialValue: { current: 'partner' }, readOnly: true });
	});

	it('lists its tabs as Allgemein, Inhalt, Anfragen, SEO & Teilen', () => {
		expect(partnerPage.groups.map(({ name }) => name)).toStrictEqual([
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

	it('splits the content into four sections, each in its own tab', () => {
		const content = field('content');

		expect(content.fields?.map(({ group, name }) => [name, group])).toStrictEqual([
			['whySection', 'why'],
			['waysSection', 'ways'],
			['partnersSection', 'partners'],
			['contactPersonsSection', 'contactPersons'],
		]);
	});

	it('presets the inquiry address and subject', () => {
		expect(inquiryField('email')).toMatchObject({
			initialValue: 'partner@tsg-irlich.de',
			type: 'email',
		});
		expect(inquiryField('subject')).toMatchObject({
			initialValue: 'Sponsoring bei der TSG Irlich',
		});
	});

	it.each(['reasons', 'ways'])('warns when %s does not hold four cards', (name) => {
		const check = cardsValidation(name);

		expect(check([{}, {}, {}])).toBe('Das Raster ist für 4 Karten gebaut.');
		expect(check([{}, {}, {}, {}, {}])).toBe('Das Raster ist für 4 Karten gebaut.');
		expect(check([{}, {}, {}, {}])).toBe(true);
		expect(check()).toBe(true);
	});

	it('offers the shared icon list on every card', () => {
		expect(cardField('reasons', 'icon').options?.list).toStrictEqual(PARTNER_ICONS);
		expect(cardField('ways', 'icon').options?.list).toStrictEqual(PARTNER_ICONS);
	});

	it('shows a fixed title in lists', () => {
		expect((partnerPage.preview.prepare as () => unknown)()).toStrictEqual({
			title: 'Sponsoren & Partner',
		});
	});
});
