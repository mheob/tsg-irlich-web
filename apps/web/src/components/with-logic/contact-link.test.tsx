import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { ContactLink } from './contact-link';

// Accessibility observation, not a bug fixed here: `ContactLink` spreads `...props` and only then
// sets `'aria-label'` (`contact-link.tsx`'s `renderProps`), so it always wins over anything a
// caller passes — before interaction it is forced to the generic string below regardless of
// whether the link is an email, a phone number or a WhatsApp link, and after interaction it is
// removed outright. `ui/contact-button.tsx` passes a purpose-specific `aria-label` ("E-Mail",
// "Telefon", "Whatsapp") together with an `aria-hidden` icon as the only child — once a user
// interacts with that button once (even just by focusing or hovering it), `ContactLink` both
// overwrites/removes that label AND the visible content is `aria-hidden`, so the button is left
// with no accessible name at all. The last two tests below pin this against `ContactLink` directly.
// Declared once at module scope rather than as an inline object literal in the JSX below, per the
// `react-perf/jsx-no-new-object-as-prop` rule (still active for `.test.tsx` files despite the
// `**/*.tsx` override in `oxlint.config.ts`).
const MAILTO_HEADER = { subject: 'Hallo Welt', body: 'Bitte um Rückruf' };

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

	it('exposes only a generic aria-label before interaction, not identifying whether this is an email, phone or WhatsApp link', () => {
		const { getByRole } = renderWithUser(
			<ContactLink href="mailto:info@tsg-irlich.de">info@tsg-irlich.de</ContactLink>,
		);

		expect(getByRole('button').getAttribute('aria-label')).toBe(
			'Kontaktlink - tippen zum Anzeigen',
		);
	});

	it('is left with no accessible name at all once interacted with, when its content is hidden from assistive technology (as ui/contact-button.tsx renders it)', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink href="mailto:info@tsg-irlich.de">
				<span aria-hidden="true">Icon</span>
			</ContactLink>,
		);

		await user.click(getByRole('button'));

		const link = getByRole('link');
		expect(link.getAttribute('aria-label')).toBeNull();
		expect(link.getAttribute('aria-labelledby')).toBeNull();
		// The only content is still there in the DOM (`textContent` sees it), but hidden from
		// assistive technology — together with the two assertions above, nothing is left to give this
		// link an accessible name.
		expect(link.textContent).toBe('Icon');
		expect(link.querySelector('[aria-hidden="true"]')).not.toBeNull();
	});
});
