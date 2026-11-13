import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

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

/** One rule of a validation, as far as a test can follow its builder chain. */
interface ChainLink {
	error: (message: string) => ChainLink;
	max: (length: number) => ChainLink;
	required: () => ChainLink;
	warning: (message: string) => ChainLink;
}

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

/**
 * Follows the builder chain of one rule and writes every call into `calls`.
 *
 * @param calls - The calls of the rule so far.
 * @returns The link the next call of the chain lands on.
 */
function followChain(calls: string[]): ChainLink {
	const link: ChainLink = {
		error: (message) => {
			calls.push(`error: ${message}`);
			return link;
		},
		max: (length) => {
			calls.push(`max: ${length}`);
			return link;
		},
		required: () => {
			calls.push('required');
			return link;
		},
		warning: (message) => {
			calls.push(`warning: ${message}`);
			return link;
		},
	};

	return link;
}

/**
 * Runs the validation of a field against a rule that only writes down the calls it receives, one
 * list per rule the validation returns. A builder chain like `Rule.max(65).warning(…)` leaves
 * nothing else to look at, and the lists show which check blocks publishing (`error`) and which
 * only warns.
 *
 * @param target - The field.
 * @returns The calls of every rule, in order, with their argument.
 */
function recordValidationChains(target: PageField): string[][] {
	if (!target.validation) {
		throw new Error(`Expected ${target.name} to validate.`);
	}

	const chains: string[][] = [];

	/**
	 * Every call on the rule itself starts a rule of its own.
	 *
	 * @param call - The first call of the rule.
	 * @returns The link the next call of the chain lands on.
	 */
	function start(call: string): ChainLink {
		const calls = [call];
		chains.push(calls);

		return followChain(calls);
	}

	target.validation({
		max: (length: number) => start(`max: ${length}`),
		required: () => start('required'),
	});

	return chains;
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

	it('requires the content and the inquiry settings', () => {
		expect(recordValidationChains(field('content'))).toStrictEqual([
			['required', 'error: Inhalte sind erforderlich'],
		]);
		expect(recordValidationChains(field('inquiry'))).toStrictEqual([
			['required', 'error: Die Anfrage-Einstellungen sind erforderlich'],
		]);
	});

	it('requires the inquiry address and subject', () => {
		expect(recordValidationChains(inquiryField('email'))).toStrictEqual([
			['required', 'error: Die E-Mail-Adresse ist erforderlich'],
		]);
		expect(recordValidationChains(inquiryField('subject'))).toStrictEqual([
			['required', 'error: Der Betreff ist erforderlich'],
		]);
	});

	// A long title or text breaks the grid of the website, but an editor may still publish it: the
	// length only warns, and no card field has a minimum length.
	it.each(['reasons', 'ways'])(
		'requires a title, a text and an icon on every card of %s and only warns at length',
		(name) => {
			expect(recordValidationChains(cardField(name, 'title'))).toStrictEqual([
				['required', 'error: Der Titel ist erforderlich'],
				['max: 65', 'warning: Der Titel sollte nicht länger als 65 Zeichen sein'],
			]);
			expect(recordValidationChains(cardField(name, 'text'))).toStrictEqual([
				['required', 'error: Der Text ist erforderlich'],
				['max: 160', 'warning: Der Text sollte nicht länger als 160 Zeichen sein'],
			]);
			expect(recordValidationChains(cardField(name, 'icon'))).toStrictEqual([
				['required', 'error: Das Icon ist erforderlich'],
			]);
		},
	);

	// The cards of `ways` carry no button of their own (WEB-326 follow-up): the own-idea button below
	// them starts every inquiry.
	it('gives a way a title, a text, benefits and an icon, but no button', () => {
		expect(cards('ways').of?.[0]?.fields.map((wayField) => wayField.name)).toStrictEqual([
			'title',
			'text',
			'benefits',
			'icon',
		]);
	});

	it('offers the shared icon list on every card', () => {
		expect(cardField('reasons', 'icon').options?.list).toStrictEqual(PAGE_ICONS);
		expect(cardField('ways', 'icon').options?.list).toStrictEqual(PAGE_ICONS);
	});

	it('shows a fixed title in lists', () => {
		expect((partnerPage.preview.prepare as () => unknown)()).toStrictEqual({
			title: 'Sponsoren & Partner',
		});
	});
});
