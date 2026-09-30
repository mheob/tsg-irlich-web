import { within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { MobileNavigation } from './mobile-navigation';
import type { NavigationEntry, NavigationGroupEntry } from './navigation-entries';

const ANGEBOT: NavigationEntry = {
	kind: 'link',
	link: {
		description: null,
		href: '/angebot',
		isActive: true,
		isExternal: false,
		key: 'angebot',
		title: 'Angebot',
	},
};

const VEREIN: NavigationGroupEntry = {
	hasTwoColumns: false,
	isActive: false,
	key: 'verein',
	kind: 'group',
	links: [
		{
			description: null,
			href: '/verein',
			isActive: false,
			isExternal: false,
			key: 'verein-overview',
			title: 'Übersicht',
		},
		{
			description: null,
			href: '/kontakt',
			isActive: false,
			isExternal: false,
			key: 'kontakt',
			title: 'Kontakt',
		},
	],
	title: 'Verein',
};

function renderMobile(entries: NavigationEntry[] = [VEREIN, ANGEBOT], onNavigate = vi.fn()) {
	return {
		onNavigate,
		...renderWithUser(<MobileNavigation entries={entries} onNavigate={onNavigate} />),
	};
}

describe('mobile navigation', () => {
	it('lists the entries and marks the active link with aria-current', () => {
		const { getByRole } = renderMobile();

		const angebot = getByRole('link', { name: 'Angebot' });

		// The group's own list sits in its collapsed, `hidden` panel, so only the outer list counts.
		expect(within(getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
		expect(angebot.getAttribute('href')).toBe('/angebot');
		expect(angebot.getAttribute('aria-current')).toBe('page');
	});

	// The collapsed panel stays in the markup (`keepMounted`) so crawlers find the pages behind it,
	// but it is `hidden`, which takes its links out of the accessibility tree and the tab order.
	it('keeps a collapsed group in the markup but out of reach', () => {
		const { getByRole, queryByRole } = renderMobile();

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
		expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		expect(getByRole('link', { hidden: true, name: 'Übersicht' }).getAttribute('href')).toBe(
			'/verein',
		);
	});

	it('expands a group on click', async () => {
		const { getByRole, user } = renderMobile();

		const trigger = getByRole('button', { name: 'Verein' });
		await user.click(trigger);

		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(getByRole('link', { name: 'Kontakt' }).getAttribute('href')).toBe('/kontakt');
	});

	it('starts with the group of the current page expanded', () => {
		const { getByRole } = renderMobile([{ ...VEREIN, isActive: true }]);

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('true');
		expect(getByRole('link', { name: 'Übersicht' })).not.toBeNull();
	});

	// The navigation lives in the root layout and survives a client-side navigation, so a group has
	// to open when its page becomes the current one, not only when the menu first mounts.
	it('expands a group once its page becomes the current one', () => {
		const onNavigate = vi.fn();
		const { getByRole, rerender } = renderWithUser(
			<MobileNavigation entries={[VEREIN]} onNavigate={onNavigate} />,
		);

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');

		rerender(
			<MobileNavigation entries={[{ ...VEREIN, isActive: true }]} onNavigate={onNavigate} />,
		);

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('true');
	});

	it('leaves a group collapsed that the visitor closed while its page stays the current one', async () => {
		const onNavigate = vi.fn();
		const active = { ...VEREIN, isActive: true };
		const { getByRole, rerender, user } = renderWithUser(
			<MobileNavigation entries={[active]} onNavigate={onNavigate} />,
		);

		await user.click(getByRole('button', { name: 'Verein' }));
		rerender(<MobileNavigation entries={[{ ...active }]} onNavigate={onNavigate} />);

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
	});

	it('reports every followed link, inside a group or not', async () => {
		const { getByRole, onNavigate, user } = renderMobile();

		await user.click(getByRole('link', { name: 'Angebot' }));
		await user.click(getByRole('button', { name: 'Verein' }));
		await user.click(getByRole('link', { name: 'Kontakt' }));

		expect(onNavigate).toHaveBeenCalledTimes(2);
	});
});
