import { describe, expect, it } from 'vitest';

import { renderWithUser } from '../../../test-utils/render';
import { ContactLink } from './contact-link';

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

	it('resolves to the exact wa.me href, unchanged, once interacted with', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink href="https://wa.me/491761234567">+49 176 1234567</ContactLink>,
		);

		await user.click(getByRole('button'));

		expect(getByRole('link').getAttribute('href')).toBe('https://wa.me/491761234567');
	});

	it('exposes only a generic aria-label before interaction, not identifying whether this is an email, phone or WhatsApp link', () => {
		const { getByRole } = renderWithUser(
			<ContactLink href="mailto:info@tsg-irlich.de">info@tsg-irlich.de</ContactLink>,
		);

		expect(getByRole('button').getAttribute('aria-label')).toBe(
			'Kontaktlink - tippen zum Anzeigen',
		);
	});

	// With no `children`, the rendered text falls back to `reverse(hrefText)` before interaction.
	// A plain ASCII href has no grapheme clusters spanning more than one UTF-16 code unit and no
	// parentheses, so this pins the baseline: every character reversed in place, nothing else.
	it('renders the reversed href text before any interaction', () => {
		const { getByRole } = renderWithUser(<ContactLink href="tel:+49 176 1234567" />);

		expect(getByRole('button').textContent).toBe('7654321 671 94+');
	});

	// The 😀 emoji is a surrogate pair (two UTF-16 code units). Reversing by code unit instead of by
	// grapheme cluster splits the pair apart and reassembles it in the wrong order, producing two lone
	// surrogates instead of the original emoji. `reverse()` segments with `Intl.Segmenter` precisely to
	// keep this cluster intact, so this is the case that actually pins grapheme-awareness.
	it('keeps a multi-code-unit grapheme cluster intact when reversing, rather than reversing UTF-16 code units', () => {
		const { getByRole } = renderWithUser(<ContactLink href="tel:+49 176 😀 1234567" />);

		expect(getByRole('button').textContent).toBe('7654321 😀 671 94+');
	});

	// `reverse()` also swaps `(` for `)` (and vice versa) as it reverses, so a parenthesised area code
	// still opens and closes the right way round instead of ending up back to front.
	it('swaps parentheses so they still point the right way once the text is reversed', () => {
		const { getByRole } = renderWithUser(<ContactLink href="tel:+49 (0)176 1234567" />);

		expect(getByRole('button').textContent).toBe('7654321 671(0) 94+');
	});

	// `contact-link.tsx`'s `renderProps` spreads `...props` and only THEN sets `'aria-label'`, so a
	// caller-supplied label always loses — before interaction it is forced to the generic string
	// above regardless of what the caller passed, after interaction it is discarded outright. This is
	// the mechanism the next test (no accessible name at all) rests on: a component "fixed" to defer
	// to a caller's label when one is supplied would still pass every other case in this file
	// unchanged, so this is the one that actually pins it.
	it('overrides a caller-supplied aria-label with its own generic one before interaction, and discards it entirely after interaction', async () => {
		const { getByRole, user } = renderWithUser(
			<ContactLink aria-label="E-Mail" href="mailto:info@tsg-irlich.de">
				info@tsg-irlich.de
			</ContactLink>,
		);

		expect(getByRole('button').getAttribute('aria-label')).toBe(
			'Kontaktlink - tippen zum Anzeigen',
		);

		await user.click(getByRole('button'));

		expect(getByRole('link').getAttribute('aria-label')).toBeNull();
	});

	// `ui/contact-button.tsx` passes a purpose-specific `aria-label` ("E-Mail", "Telefon", "Whatsapp")
	// together with an `aria-hidden` icon as the only child. Once a user interacts with such a button
	// even once — including just hovering or focusing it, since `onMouseOver`/`onFocus` also call
	// `handleInteraction` — `ContactLink` discards that label (pinned above) and the only remaining
	// content is `aria-hidden`, leaving the button with no accessible name at all.
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
