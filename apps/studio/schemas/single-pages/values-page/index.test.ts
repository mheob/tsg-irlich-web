import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import valuesPage from './index';
import { checkLinkCount, getCountCheck } from './sections';

interface PageField {
	fields?: PageField[];
	group?: string;
	groups?: { name: string; title: string }[];
	initialValue?: unknown;
	name: string;
	of?: { fields?: PageField[]; name?: string; type?: string }[];
	options?: { list?: readonly string[] };
	readOnly?: boolean;
	type: string;
	validation?: (rule: unknown) => unknown;
}

const fields = valuesPage.fields as unknown as PageField[];

function field(name: string, parent?: PageField): PageField {
	const found = (parent?.fields ?? fields).find((candidate) => candidate.name === name);

	if (!found) {
		throw new Error(`Missing field ${name}`);
	}

	return found;
}

function section(name: string): PageField {
	return field(name, field('content'));
}

function member(arrayField: PageField): PageField {
	const first = arrayField.of?.at(0);

	if (!first?.fields) {
		throw new Error(`${arrayField.name} has no object member`);
	}

	return first as PageField;
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

describe('the values page schema', () => {
	it('is the singleton with the fixed slug werte', () => {
		expect(valuesPage.name).toBe('valuesPage');
		expect(field('slug')).toMatchObject({ initialValue: { current: 'werte' }, readOnly: true });
	});

	it('splits its content into „Wer wir sind“, „Werte“ and „Mach mit“', () => {
		expect(field('content').groups?.map(({ title }) => title)).toStrictEqual([
			'Wer wir sind',
			'Werte',
			'Mach mit',
		]);
		expect(field('content').fields?.map(({ group, name }) => [name, group])).toStrictEqual([
			['aboutSection', 'about'],
			['valuesSection', 'values'],
			['joinSection', 'join'],
		]);
	});

	it('gives the intro a section header, an image and facts of value and label', () => {
		const intro = section('aboutSection');

		expect(intro.fields?.map(({ name }) => name)).toStrictEqual([
			'title',
			'subtitle',
			'intro',
			'image',
			'facts',
		]);
		expect(member(field('facts', intro)).fields?.map(({ name }) => name)).toStrictEqual([
			'value',
			'label',
		]);
	});

	it('starts the table of contents as „Inhalt“ and requires at least one value', () => {
		const values = section('valuesSection');

		expect(field('tocTitle', values).initialValue).toBe('Inhalt');
		expect(recordedRuleCalls(field('values', values))).toStrictEqual(['required', 'min', 'error']);
	});

	it('lets a value pick an icon of the shared list and carry a quote and highlights', () => {
		const value = member(field('values', section('valuesSection')));

		expect(value.fields?.map(({ name }) => name)).toStrictEqual([
			'title',
			'icon',
			'teaser',
			'text',
			'quote',
			'highlights',
		]);
		expect(field('icon', value).options?.list).toStrictEqual([...PAGE_ICONS]);
		expect(field('text', value).type).toBe('simpleBlockContent');
	});

	it('requires title, icon and text of a value, but not its teaser, quote or highlights', () => {
		const value = member(field('values', section('valuesSection')));

		for (const name of ['title', 'icon', 'text']) {
			expect(recordedRuleCalls(field(name, value))).toContain('required');
		}
		for (const name of ['teaser', 'quote', 'highlights']) {
			expect(recordedRuleCalls(field(name, value))).not.toContain('required');
		}
	});

	it('builds the closing buttons from navigation links', () => {
		const join = section('joinSection');

		expect(field('links', join).of).toStrictEqual([{ type: 'navigationLink' }]);
		expect(recordedRuleCalls(field('title', join))).toContain('required');
	});
});

describe('the count check of the values page', () => {
	const check = getCountCheck(4, 'Für 4 gebaut.');

	it.each([
		['a missing list', undefined],
		['an empty list', []],
		['exactly four entries', [1, 2, 3, 4]],
	])('accepts %s', (_case, items) => {
		expect(check(items)).toBe(true);
	});

	it.each([
		['three', [1, 2, 3]],
		['five', [1, 2, 3, 4, 5]],
	])('warns at %s entries', (_case, items) => {
		expect(check(items)).toBe('Für 4 gebaut.');
	});
});

describe('the button check of the closing section', () => {
	it.each([
		['no list', undefined],
		['two buttons', [{}, {}]],
	])('accepts %s', (_case, links) => {
		expect(checkLinkCount(links)).toBe(true);
	});

	it('warns at a third button', () => {
		expect(checkLinkCount([{}, {}, {}])).toBe('Der Abschluss zeigt höchstens zwei Buttons.');
	});
});
