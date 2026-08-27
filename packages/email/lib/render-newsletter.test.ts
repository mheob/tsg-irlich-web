import { pretty } from 'react-email';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderNewsletterHtml, renderNewsletterTemplate } from './render-newsletter';

// Removes every HTML comment, whatever its content. Written locally instead of reusing
// `stripCleverReachMarkers`/`toCleverReachTemplate` so the expectation is not built from
// the code under test.
function withoutHtmlComments(value: string): string {
	return value.replaceAll(/<!--[\s\S]*?-->/gu, '');
}

describe('newsletter html rendering', () => {
	it('produces a mailing with no cleverreach markers or comments', async () => {
		const html = await renderNewsletterHtml();

		expect(html).not.toContain('@@CR');
		expect(html).not.toContain('<!--#');
	});

	it('produces a template with cleverreach comments', async () => {
		const template = await renderNewsletterTemplate();

		expect(template).toContain('<!--#html mode="default"#-->');
		expect(template).toContain('<!--#/html#-->');
	});

	it('differs from the mailing only by the comments isTemplate adds', async () => {
		const html = await renderNewsletterHtml();
		const template = await renderNewsletterTemplate();

		// `renderNewsletterTemplate` passes `isTemplate: true` and then converts the
		// resulting markers into comments; `renderNewsletterHtml` never touches either
		// step. Stripping every comment from both should leave identical markup if that
		// flag is the only source of divergence.
		expect(withoutHtmlComments(template)).toBe(withoutHtmlComments(html));
	});

	// Regression case: `<Html lang="de">` in newsletter.tsx is correct, but `<Body>` is rendered
	// without a `lang` prop, and react-email's `Body` defaults it to `lang="en"` on both the
	// `<body>` element and the inner `<td>` it wraps the content in (`react-email`'s
	// `components/body/body.tsx`: `lang={props.lang ?? 'en'}`). The document therefore claims
	// German at the top and English for everything inside it — a WCAG 3.1.2 (Language of Parts)
	// defect that is worse than a plain wrong `lang`, because the inner claim silently overrides
	// the right one for every string this German newsletter renders. `emails/contact-forward.tsx`
	// has the same react-email default biting it one level up, on `<Html>`. Fixing production code
	// is out of scope here, so this pins the current, wrong value rather than the intended one.
	it('renders a body that overrides the document language, a known defect', async () => {
		const html = await renderNewsletterHtml();

		expect(html).toContain('<html dir="ltr" lang="de">');
		expect(html).toContain('<body dir="ltr" lang="en"');
	});
});

describe('newsletter snapshots', () => {
	// `newsletter-footer.tsx` computes `new Date().getFullYear()` for its copyright line, so an
	// unfrozen clock would bake the wall-clock year into the snapshot and fail the suite every
	// New Year's Day for a reason unrelated to any code change. Freezing the system time keeps
	// the year — and therefore the whole snapshot — stable no matter when the suite runs.
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('matches the mailing snapshot', async () => {
		const html = await renderNewsletterHtml();

		// Pretty-printed so the snapshot breaks on element boundaries: a future diff is
		// line-level instead of one ~20 KB unbroken line that gets re-recorded on sight. `pretty`
		// is `@react-email/render`'s own formatter (re-exported from `react-email`, already a
		// dependency here) — no new dependency added for this.
		await expect(pretty(html)).resolves.toMatchSnapshot();
	});

	it('matches the template snapshot', async () => {
		const template = await renderNewsletterTemplate();

		await expect(pretty(template)).resolves.toMatchSnapshot();
	});
});
