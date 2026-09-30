import { act, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithUser } from '../../../../test-utils/render';
import { createMatchMediaStub, dispatchMediaQueryChange } from '../../../../test-utils/setup-dom';
import { DesktopNavigation } from './desktop-navigation';
import type { NavigationEntry } from './navigation-entries';

const ANGEBOT: NavigationEntry = {
	kind: 'link',
	link: { href: '/angebot', isActive: true, isExternal: false, key: 'angebot', title: 'Angebot' },
};

const HOME: NavigationEntry = {
	kind: 'link',
	link: { href: '/', isActive: false, isExternal: false, key: 'home', title: 'Home' },
};

const VEREIN: NavigationEntry = {
	isActive: true,
	key: 'verein',
	kind: 'group',
	links: [
		{
			href: '/verein',
			isActive: false,
			isExternal: false,
			key: 'verein-overview',
			title: 'Übersicht',
		},
		{ href: '/kontakt', isActive: true, isExternal: false, key: 'kontakt', title: 'Kontakt' },
		{
			href: 'https://www.neuwied.de',
			isActive: false,
			isExternal: true,
			key: 'neuwied',
			title: 'Stadt Neuwied',
		},
	],
	title: 'Verein',
};

function renderDesktop(entries: NavigationEntry[] = [HOME, VEREIN, ANGEBOT]) {
	return renderWithUser(<DesktopNavigation entries={entries} />);
}

describe('desktop navigation', () => {
	// The bar only exists from the lg breakpoint on, and it closes its panels below it.
	beforeEach(() => {
		vi.stubGlobal('matchMedia', createMatchMediaStub(true));
	});

	afterEach(() => {
		vi.stubGlobal('matchMedia', createMatchMediaStub(false));
	});

	it('renders plain entries as links and marks the active one with aria-current', () => {
		const { getByRole } = renderDesktop();

		const angebot = getByRole('link', { name: 'Angebot' });
		const home = getByRole('link', { name: 'Home' });

		expect(angebot.getAttribute('href')).toBe('/angebot');
		expect(angebot.getAttribute('aria-current')).toBe('page');
		expect(home.getAttribute('aria-current')).toBeNull();
	});

	// The shell already renders `<nav aria-label="Hauptnavigation">`; Base UI's root would add a
	// second, unnamed navigation landmark inside it.
	it('adds no navigation landmark of its own', () => {
		const { queryAllByRole } = renderDesktop();

		expect(queryAllByRole('navigation')).toHaveLength(0);
	});

	it('renders a group as a collapsed button whose panel is not rendered yet', () => {
		const { getByRole, queryByRole } = renderDesktop();

		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
		expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
	});

	it('opens the panel with "Übersicht" first, followed by the children', async () => {
		const { getByRole, user } = renderDesktop();

		const trigger = getByRole('button', { name: 'Verein' });
		await user.click(trigger);

		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		const panel = getByRole('link', { name: 'Übersicht' }).closest('ul') as HTMLElement;

		expect(
			within(panel)
				.getAllByRole('link')
				.map((link) => link.getAttribute('href')),
		).toStrictEqual(['/verein', '/kontakt', 'https://www.neuwied.de']);
		expect(
			getByRole('link', { name: 'Stadt Neuwied (öffnet in neuem Tab)' }).getAttribute('target'),
		).toBe('_blank');
	});

	// The fixture marks `Angebot` in the bar and `Kontakt` in the panel active to test each place;
	// the view model itself never marks two links at once.
	it('marks the active link inside the open panel with aria-current', async () => {
		const { getAllByRole, getByRole, user } = renderDesktop();

		await user.click(getByRole('button', { name: 'Verein' }));

		expect(getByRole('link', { name: 'Übersicht' }).getAttribute('aria-current')).toBeNull();
		expect(getByRole('link', { name: 'Kontakt' }).getAttribute('aria-current')).toBe('page');
		expect(
			getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page'),
		).toHaveLength(2);
	});

	// Base UI only closes on a focus that leaves the whole menu, so tabbing from the last link of a
	// panel on to the next item of the bar would leave the panel open over the page.
	it('closes the panel once the focus moves on to a plain link of the bar', async () => {
		const { getByRole, queryByRole, user } = renderDesktop();

		await user.click(getByRole('button', { name: 'Verein' }));
		getByRole('link', { name: 'Angebot' }).focus();

		await waitFor(() => {
			expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		});
		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
	});

	it('closes the panel once the focus moves on to the trigger of the next group', async () => {
		const angebot: NavigationEntry = {
			isActive: false,
			key: 'angebot',
			kind: 'group',
			links: [
				{
					href: '/angebot',
					isActive: false,
					isExternal: false,
					key: 'angebot-overview',
					title: 'Übersicht Angebot',
				},
			],
			title: 'Angebot',
		};
		const { getByRole, queryByRole, user } = renderDesktop([VEREIN, angebot, HOME]);

		await user.click(getByRole('button', { name: 'Verein' }));
		getByRole('button', { name: 'Angebot' }).focus();

		await waitFor(() => {
			expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		});
		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
	});

	// Below lg the bar is hidden, so an open panel would float at the top left with nothing to anchor
	// it. Closing the group also keeps the panel from coming back once the window grows again.
	it('closes the panel when the viewport drops below lg, and keeps it closed when it grows again', async () => {
		const { getByRole, queryByRole, user } = renderDesktop();
		const desktop = globalThis.matchMedia('(min-width: 64rem)');

		await user.click(getByRole('button', { name: 'Verein' }));
		expect(queryByRole('link', { name: 'Übersicht' })).not.toBeNull();

		act(() => {
			dispatchMediaQueryChange(desktop, false);
		});
		await waitFor(() => {
			expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		});

		act(() => {
			dispatchMediaQueryChange(desktop, true);
		});
		expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
	});

	it('closes the panel when one of its links is followed', async () => {
		const { getByRole, queryByRole, user } = renderDesktop();

		await user.click(getByRole('button', { name: 'Verein' }));
		await user.click(getByRole('link', { name: 'Kontakt' }));

		await waitFor(() => {
			expect(queryByRole('link', { name: 'Übersicht' })).toBeNull();
		});
		expect(getByRole('button', { name: 'Verein' }).getAttribute('aria-expanded')).toBe('false');
	});
});
