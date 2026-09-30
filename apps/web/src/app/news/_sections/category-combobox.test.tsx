import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { routerMock } from '../../../../test-utils/setup-dom';
import { CategoryCombobox } from './category-combobox';

const CATEGORIES = [
	{ articleCount: 3, slug: 'after-work-fitness', title: 'After Work Fitness' },
	{ articleCount: 71, slug: 'fussball', title: 'Fußball' },
	{ articleCount: 21, slug: 'jugend', title: 'Jugend' },
];

function inputValue(element: HTMLElement): string {
	return (element as HTMLInputElement).value;
}

describe('category combobox', () => {
	it('shows all news as the selection on the overview', () => {
		const { getByRole } = renderWithUser(<CategoryCombobox categories={CATEGORIES} total={95} />);

		expect(inputValue(getByRole('combobox', { name: 'News-Kategorie' }))).toBe('Alle News');
	});

	it('shows the current category as the selection on its page', () => {
		const { getByRole } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} currentSlug="fussball" total={95} />,
		);

		expect(inputValue(getByRole('combobox', { name: 'News-Kategorie' }))).toBe('Fußball');
	});

	it('lists all news first, then every category with its article count', async () => {
		const { findAllByRole, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await user.click(getByRole('combobox', { name: 'News-Kategorie' }));
		const options = await findAllByRole('option');

		expect(options.map((option) => option.getAttribute('aria-label'))).toStrictEqual([
			'Alle News, 95 Artikel',
			'After Work Fitness, 3 Artikel',
			'Fußball, 71 Artikel',
			'Jugend, 21 Artikel',
		]);
	});

	it('narrows the list to the categories matching what was typed over the selection', async () => {
		const { findAllByRole, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await user.type(getByRole('combobox', { name: 'News-Kategorie' }), 'fu');
		const options = await findAllByRole('option');

		expect(options.map((option) => option.getAttribute('aria-label'))).toStrictEqual([
			'Fußball, 71 Artikel',
		]);
	});

	it('says so when no category matches', async () => {
		const { findByText, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await user.type(getByRole('combobox', { name: 'News-Kategorie' }), 'Tischtennis');

		await expect(findByText('Keine Kategorie gefunden')).resolves.not.toBeNull();
	});

	it('opens the page of the chosen category', async () => {
		const { findByRole, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} total={95} />,
		);

		await user.click(getByRole('combobox', { name: 'News-Kategorie' }));
		await user.click(await findByRole('option', { name: 'Fußball, 71 Artikel' }));

		expect(routerMock.push).toHaveBeenCalledWith('/news/fussball');
	});

	it('leads back to the overview from a category', async () => {
		const { findByRole, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} currentSlug="jugend" total={95} />,
		);

		await user.click(getByRole('combobox', { name: 'News-Kategorie' }));
		await user.click(await findByRole('option', { name: 'Alle News, 95 Artikel' }));

		expect(routerMock.push).toHaveBeenCalledWith('/news');
	});

	it('stays put when the current selection is chosen again', async () => {
		const { findByRole, getByRole, user } = renderWithUser(
			<CategoryCombobox categories={CATEGORIES} currentSlug="jugend" total={95} />,
		);

		await user.click(getByRole('combobox', { name: 'News-Kategorie' }));
		await user.click(await findByRole('option', { name: 'Jugend, 21 Artikel' }));

		expect(routerMock.push).not.toHaveBeenCalled();
	});
});
