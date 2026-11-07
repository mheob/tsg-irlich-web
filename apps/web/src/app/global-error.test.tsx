import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vite-plus/test';

import GlobalError from './global-error';

// `next/font/local` runs its loader at build time and is unavailable in a test run.
vi.mock(import('./_assets/fonts/fonts'), () => ({ fontVariables: 'fonts' }));

const ERROR = new Error('layout failed');

/**
 * Renders the error document into the test's own document. `global-error.tsx` brings its own
 * `<html>` and `<body>`, which React only accepts as the root of a document, not inside a `div`.
 *
 * @param retry - The stand-in for Next.js's `retry`.
 * @returns A `user` set up against the same document; query it through `screen`.
 */
function renderGlobalError(retry = vi.fn()) {
	const user = userEvent.setup();
	render(<GlobalError error={ERROR} retry={retry} />, { container: document });

	return { user };
}

describe('the global error page', () => {
	it('renders a German document of its own', () => {
		vi.spyOn(console, 'error').mockReturnValue();

		renderGlobalError();

		expect(document.documentElement.getAttribute('lang')).toBe('de');
		expect(document.title).toBe('Fehler | TSG Irlich');
		expect(screen.getByRole('main')).not.toBeNull();
		expect(
			screen.getByRole('heading', { level: 1, name: 'Da ist etwas schiefgelaufen' }),
		).not.toBeNull();
		expect(screen.getAllByRole('heading')).toHaveLength(1);
	});

	it('logs the error it shows', () => {
		const errorSpy = vi.spyOn(console, 'error').mockReturnValue();

		renderGlobalError();

		expect(errorSpy).toHaveBeenCalledWith(ERROR);
	});

	it('renders the layout again on „Erneut versuchen“', async () => {
		vi.spyOn(console, 'error').mockReturnValue();
		const retry = vi.fn();

		const { user } = renderGlobalError(retry);
		await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));

		expect(retry).toHaveBeenCalledOnce();
	});

	it('links the contact page', () => {
		vi.spyOn(console, 'error').mockReturnValue();

		renderGlobalError();

		expect(screen.getByRole('link', { name: 'Kontakt aufnehmen' }).getAttribute('href')).toBe(
			'/kontakt',
		);
	});
});
