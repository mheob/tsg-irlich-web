import { describe, expect, it } from 'vite-plus/test';

import mainNavigationMenu, {
	prepareMainNavigationMenu,
	validateMenuChildren,
} from './main-navigation-menu';

interface MenuField {
	description?: string;
	initialValue?: unknown;
	name: string;
	of?: { type: string }[];
	title?: string;
	type: string;
}

const menuType = mainNavigationMenu as unknown as {
	fields: MenuField[];
	name: string;
	title: string;
};

function field(name: string): MenuField | undefined {
	return menuType.fields.find((candidate) => candidate.name === name);
}

describe('main navigation menu', () => {
	it('is offered as "Menü" when an entry is added', () => {
		expect([menuType.name, menuType.title]).toStrictEqual(['mainNavigationMenu', 'Menü']);
	});

	// A menu has no target of its own: the page belongs into it as a child.
	it('has a title, children and the columns switch, and no target', () => {
		expect(menuType.fields.map((candidate) => candidate.name)).toStrictEqual([
			'title',
			'children',
			'hasTwoColumns',
		]);
	});

	it('takes navigation links as children and tells editors where the page goes', () => {
		expect(field('children')).toMatchObject({
			description:
				'Die Einträge des Aufklappmenüs. Ein Menü führt selbst nirgendwohin, die Seite gehört als Unterpunkt hinein.',
			of: [{ type: 'navigationLink' }],
			title: 'Unterpunkte',
			type: 'array',
		});
	});

	it('starts in one column', () => {
		expect(field('hasTwoColumns')).toMatchObject({
			description: 'Stellt das Aufklappmenü auf dem Desktop in zwei Spalten dar.',
			initialValue: false,
			title: 'Zweispaltig',
			type: 'boolean',
		});
	});
});

describe('menu children validation', () => {
	// Review focus 5: the studio hands an untouched field over as `undefined`.
	it.each([
		['missing', undefined],
		['empty', []],
	])('refuses %s children', (_label, value) => {
		expect(validateMenuChildren(value)).toBe('Ein Menü braucht mindestens einen Unterpunkt');
	});

	it('passes with one child', () => {
		expect(validateMenuChildren([{ _key: 'chronik' }])).toBe(true);
	});
});

describe('menu preview', () => {
	it('counts its children in singular and plural', () => {
		expect(prepareMainNavigationMenu({ children: [{}], title: 'Verein' })).toStrictEqual({
			subtitle: 'Menü · 1 Unterpunkt',
			title: 'Verein',
		});
		expect(prepareMainNavigationMenu({ children: [{}, {}], title: 'Verein' })).toStrictEqual({
			subtitle: 'Menü · 2 Unterpunkte',
			title: 'Verein',
		});
	});

	it('counts no children for a menu without any', () => {
		expect(prepareMainNavigationMenu({ title: 'Neu' })).toStrictEqual({
			subtitle: 'Menü · 0 Unterpunkte',
			title: 'Neu',
		});
	});
});
