import { describe, expect, it } from 'vite-plus/test';

import { renderWithUser } from '../../../test-utils/render';
import { ContactLink } from './contact-link';

// Declared once at module scope rather than as an inline object literal in the JSX below, per the
// `react-perf/jsx-no-new-object-as-prop` rule (still active for `.test.tsx` files despite the
// `**/*.tsx` override in `vite.config.ts`).
const MAILTO_HEADER = { subject: 'Hallo Welt', body: 'Bitte um Rückruf' };

/** What an address harvester matches, in the markup as well as in the text content. */
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/u;

describe('the contact link', () => {
	it('resolves to the exact mailto href, unchanged, once interacted with', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink href="mailto:info@tsg-irlich.de">info@tsg-irlich.de</ContactLink>,
		);

		const link = getByRole('button');
		expect(link.getAttribute('href')).toBe('#');

		await user.click(link);

		expect(getByRole('link').getAttribute('href')).toBe('mailto:info@tsg-irlich.de');
	});

	it('builds the mailto href with its header parameters URL-encoded, once interacted with', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink header={MAILTO_HEADER} href="mailto:info@tsg-irlich.de">
				info@tsg-irlich.de
			</ContactLink>,
		);

		await user.click(getByRole('button'));

		expect(getByRole('link').getAttribute('href')).toBe(
			'mailto:info@tsg-irlich.de?subject=Hallo%20Welt&body=Bitte%20um%20R%C3%BCckruf',
		);
	});

	it('strips whitespace from a tel href, once interacted with', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink href="tel:+49 176 1234567">+49 176 1234567</ContactLink>,
		);

		await user.click(getByRole('button'));

		expect(getByRole('link').getAttribute('href')).toBe('tel:+491761234567');
	});

	it('resolves to the exact wa.me href, unchanged, once interacted with', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink href="https://wa.me/491761234567">+49 176 1234567</ContactLink>,
		);

		await user.click(getByRole('button'));

		expect(getByRole('link').getAttribute('href')).toBe('https://wa.me/491761234567');
	});

	// WCAG 2.5.3 (Label in Name): whoever reads or speaks the visible text has to reach the link by it.
	it('is named by its visible text before interaction', () => {
		const { getByRole } = renderWithUser(
			<ContactLink href="mailto:info@tsg-irlich.de">Autor anschreiben</ContactLink>,
		);

		expect(getByRole('button', { name: 'Autor anschreiben' })).not.toBeNull();
	});

	// `ui/contact-button.tsx` and the social media icons pass a purpose-specific `aria-label` with an
	// icon as the only content. Without that label, the control has no accessible name at all.
	it('keeps a caller-supplied aria-label before and after interaction', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink aria-label="E-Mail" href="mailto:info@tsg-irlich.de">
				<span aria-hidden="true">Icon</span>
			</ContactLink>,
		);

		await user.click(getByRole('button', { name: 'E-Mail' }));

		expect(getByRole('link', { name: 'E-Mail' })).not.toBeNull();
	});

	// dom-accessibility-api puts a space around every child that is not displayed inline, the hidden
	// spam guard included, and names this one "it @tsg-irlich.de". Browsers and axe skip a hidden
	// child without a space, so the name is compared without that one.
	it('shows a bare email address under its own accessible name', () => {
		const { getByRole } = renderWithUser(<ContactLink href="mailto:it@tsg-irlich.de" />);

		expect(
			getByRole('button', { name: (name) => name.replaceAll(' ', '') === 'it@tsg-irlich.de' }),
		).not.toBeNull();
	});

	// The spam protection: a harvester reads either the markup or its text content, and neither may
	// hold the address in one piece until a visitor interacts with the link.
	it('keeps a bare email address out of the markup and the text a harvester reads', () => {
		const { getByRole } = renderWithUser(<ContactLink href="mailto:it@tsg-irlich.de" />);

		const button = getByRole('button');

		expect(button.outerHTML).not.toMatch(EMAIL_PATTERN);
		expect(button.textContent).not.toMatch(EMAIL_PATTERN);
	});

	it('shows a bare phone number under its own accessible name, but not as one piece of text', () => {
		const { getByRole } = renderWithUser(<ContactLink href="tel:+49 176 1234567" />);

		const button = getByRole('button', { name: '+49 176 1234567' });

		expect(button.textContent).not.toContain('+49 176 1234567');
	});
});
