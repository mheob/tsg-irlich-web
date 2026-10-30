import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { SearchForm } from './search-form';

function submittedData(form: HTMLElement): Record<string, FormDataEntryValue> {
	return Object.fromEntries(new FormData(form as HTMLFormElement));
}

describe('the search form', () => {
	it('is a search landmark that sends its input to the search page by GET', () => {
		const { getByRole } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="" tab="alle" />,
		);

		const form = getByRole('search');
		expect(form.getAttribute('method')).toBe('get');
		expect(form.getAttribute('action')).toBe('/suche');
	});

	it('names the field „Suchbegriff“ and shows the placeholder', () => {
		const { getByRole } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="" tab="alle" />,
		);

		const input = getByRole('searchbox', { name: 'Suchbegriff' });
		expect(input.getAttribute('placeholder')).toBe('Wonach suchst du?');
		expect((input as HTMLInputElement).value).toBe('');
	});

	it('shows the search term of the current search', () => {
		const { getByRole } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="Tanzen" tab="alle" />,
		);

		expect((getByRole('searchbox', { name: 'Suchbegriff' }) as HTMLInputElement).value).toBe(
			'Tanzen',
		);
	});

	it('stops the input at the longest search term', () => {
		const { getByRole } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="" tab="alle" />,
		);

		expect(getByRole('searchbox', { name: 'Suchbegriff' }).getAttribute('maxlength')).toBe('100');
	});

	it('offers the submit button „Suchen“', () => {
		const { getByRole } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="" tab="alle" />,
		);

		expect(getByRole('button', { name: 'Suchen' }).getAttribute('type')).toBe('submit');
	});

	it('submits the typed term as q', async () => {
		const { getByRole, user } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="" tab="alle" />,
		);

		await user.type(getByRole('searchbox', { name: 'Suchbegriff' }), 'Fußball');

		expect(submittedData(getByRole('search'))).toStrictEqual({ q: 'Fußball' });
	});

	it.each(['seiten', 'news'] as const)('keeps the tab %s as typ', (tab) => {
		const { getByRole } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="Tanzen" tab={tab} />,
		);

		expect(submittedData(getByRole('search'))).toStrictEqual({ q: 'Tanzen', typ: tab });
	});

	it('sends no typ for „Alle“', () => {
		const { getByRole } = renderWithUser(
			<SearchForm placeholder="Wonach suchst du?" query="Tanzen" tab="alle" />,
		);

		expect(submittedData(getByRole('search'))).toStrictEqual({ q: 'Tanzen' });
	});
});
