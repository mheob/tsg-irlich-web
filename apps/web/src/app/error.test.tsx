import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../test-utils/render';
import ErrorPage from './error';

const ERROR = new Error('content lake unreachable');

describe('the error page', () => {
	it('heads the page with what went wrong', () => {
		vi.spyOn(console, 'error').mockReturnValue();

		const { getAllByRole, getByRole } = renderWithUser(<ErrorPage error={ERROR} retry={vi.fn()} />);

		expect(getByRole('heading', { level: 1, name: 'Da ist etwas schiefgelaufen' })).not.toBeNull();
		expect(getAllByRole('heading')).toHaveLength(1);
	});

	it('logs the error it shows', () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		renderWithUser(<ErrorPage error={ERROR} retry={vi.fn()} />);

		expect(errorSpy).toHaveBeenCalledWith(ERROR);
	});

	it('renders the page again on „Erneut versuchen“', async () => {
		vi.spyOn(console, 'error').mockReturnValue();
		const retry = vi.fn();

		const { getByRole, user } = renderWithUser(<ErrorPage error={ERROR} retry={retry} />);
		await user.click(getByRole('button', { name: 'Erneut versuchen' }));

		expect(retry).toHaveBeenCalledOnce();
	});

	it('links the contact page', () => {
		vi.spyOn(console, 'error').mockReturnValue();

		const { getByRole } = renderWithUser(<ErrorPage error={ERROR} retry={vi.fn()} />);

		expect(getByRole('link', { name: 'Kontakt aufnehmen' }).getAttribute('href')).toBe('/kontakt');
	});
});
