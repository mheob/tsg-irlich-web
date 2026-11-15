import { setTimeout as delay } from 'node:timers/promises';

import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import type { CategoryCombobox as CategoryComboboxComponent } from './category-combobox';

const CATEGORIES = [
	{ articleCount: 71, slug: 'fussball', title: 'Fußball' },
	{ articleCount: 21, slug: 'jugend', title: 'Jugend' },
];

/**
 * Whether the element is the placeholder, which is read-only, or the loaded combobox.
 *
 * @param element - The element named `News-Kategorie`.
 * @returns `true` for the placeholder.
 */
function isPlaceholder(element: HTMLElement): boolean {
	return (element as HTMLInputElement).readOnly;
}

function inputValue(element: HTMLElement): string {
	return (element as HTMLInputElement).value;
}

describe('category combobox', () => {
	let CategoryCombobox: typeof CategoryComboboxComponent;

	// The module remembers that the combobox has loaded, so every case starts from a fresh copy. The
	// page counts as still loading, so only using the placeholder loads the combobox unless a case says
	// otherwise: a load right after the first render would swap the placeholder from under the click.
	beforeEach(async () => {
		vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
		vi.resetModules();
		({ CategoryCombobox } = await import('./category-combobox'));
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders a placeholder with the current selection before the combobox loads', () => {
		const { getByRole } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} currentSlug="jugend" total={95} />,
		);
		const combobox = getByRole('combobox', { name: 'News-Kategorie' });

		expect(isPlaceholder(combobox)).toBe(true);
		expect(inputValue(combobox)).toBe('Jugend');
		expect(combobox.getAttribute('aria-expanded')).toBe('false');
	});

	it('shows all news on the overview', () => {
		const { getByRole } = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);

		expect(inputValue(getByRole('combobox', { name: 'News-Kategorie' }))).toBe('Alle News');
	});

	it('loads the combobox and opens its list on a press of the placeholder', async () => {
		const { findAllByRole, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await user.click(getByRole('combobox', { name: 'News-Kategorie' }));

		await expect(findAllByRole('option')).resolves.toHaveLength(3);
	});

	it('opens the list after a press of the trigger, too', async () => {
		const { findAllByRole, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await user.click(getByRole('button', { name: 'Auswahl öffnen' }));

		await expect(findAllByRole('option')).resolves.toHaveLength(3);
	});

	it('hands the focus over to the combobox when the placeholder is reached by keyboard', async () => {
		const { getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await user.tab();

		await waitFor(() => {
			const combobox = getByRole('combobox', { name: 'News-Kategorie' });
			expect(isPlaceholder(combobox)).toBe(false);
			expect(document.activeElement).toBe(combobox);
		});
	});

	it('opens the list on an arrow key pressed on the placeholder', async () => {
		const { findAllByRole, getByRole } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);
		const combobox = getByRole('combobox', { name: 'News-Kategorie' });

		combobox.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));

		await expect(findAllByRole('option')).resolves.toHaveLength(3);
	});

	it('ignores other keys on the placeholder', () => {
		const { getByRole } = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);
		const combobox = getByRole('combobox', { name: 'News-Kategorie' });

		combobox.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));

		expect(isPlaceholder(getByRole('combobox', { name: 'News-Kategorie' }))).toBe(true);
	});

	it('loads the combobox on its own once the page has loaded', async () => {
		vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
		const { getByRole, queryAllByRole } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await waitFor(() => {
			expect(isPlaceholder(getByRole('combobox', { name: 'News-Kategorie' }))).toBe(false);
		});
		expect(queryAllByRole('option')).toStrictEqual([]);
		expect(document.activeElement).not.toBe(getByRole('combobox', { name: 'News-Kategorie' }));
	});

	it('waits for the load event while the page is still loading', async () => {
		const { getByRole } = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);

		await delay(50);
		expect(isPlaceholder(getByRole('combobox', { name: 'News-Kategorie' }))).toBe(true);

		globalThis.dispatchEvent(new Event('load'));

		await waitFor(() => {
			expect(isPlaceholder(getByRole('combobox', { name: 'News-Kategorie' }))).toBe(false);
		});
	});

	it('stops waiting for the load event when it unmounts first', () => {
		const removeEventListener = vi.spyOn(globalThis, 'removeEventListener');
		const { unmount } = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);

		unmount();

		expect(removeEventListener).toHaveBeenCalledWith('load', expect.any(Function));
	});

	it('cancels the pending load when it unmounts right after the page has loaded', () => {
		vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete');
		const clearTimeout = vi.spyOn(globalThis, 'clearTimeout');
		const { unmount } = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);

		unmount();

		expect(clearTimeout).toHaveBeenCalledWith(expect.anything());
	});

	it('shows the combobox right away once it has loaded before', async () => {
		const first = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);
		await first.user.click(first.getByRole('combobox', { name: 'News-Kategorie' }));
		await first.findAllByRole('option');
		first.unmount();

		const { getByRole } = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);

		expect(isPlaceholder(getByRole('combobox', { name: 'News-Kategorie' }))).toBe(false);
	});
});
