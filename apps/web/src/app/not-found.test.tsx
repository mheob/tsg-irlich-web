import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../test-utils/render';
import NotFound, { metadata } from './not-found';

describe('the not-found page', () => {
	it('names the page in its title and description instead of the home page', () => {
		expect(metadata.title).toBe('Seite nicht gefunden');
		expect(metadata.description).toContain('nicht oder nicht mehr');
	});

	it('heads the page with what went wrong', () => {
		const { getAllByRole, getByRole } = renderWithUser(<NotFound />);

		expect(getByRole('heading', { level: 1, name: 'Seite nicht gefunden' })).not.toBeNull();
		expect(getAllByRole('heading')).toHaveLength(1);
	});

	it('offers a search that sends the term to the search page without JavaScript', () => {
		const { getByRole } = renderWithUser(<NotFound />);

		const form = getByRole('search');
		const field = getByRole('searchbox', { name: 'Suchbegriff' });

		expect(form.getAttribute('action')).toBe('/suche');
		expect(form.getAttribute('method')).toBe('get');
		expect(field.getAttribute('name')).toBe('q');
		expect(form.contains(field)).toBe(true);
		expect(getByRole('button', { name: 'Suchen' }).getAttribute('type')).toBe('submit');
	});

	it('links the offer, the news and the contact page', () => {
		const { getByRole } = renderWithUser(<NotFound />);

		const navigation = getByRole('navigation', { name: 'Beliebte Seiten' });
		const links = [...navigation.querySelectorAll('a')].map((link) => [
			link.textContent,
			link.getAttribute('href'),
		]);

		expect(links).toStrictEqual([
			['Unser Angebot', '/angebot'],
			['News', '/news'],
			['Kontakt', '/kontakt'],
		]);
	});
});
