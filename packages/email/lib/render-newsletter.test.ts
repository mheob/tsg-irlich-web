import { describe, expect, it } from 'vitest';

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
});

describe('newsletter snapshots', () => {
	it('matches the mailing snapshot', async () => {
		const html = await renderNewsletterHtml();

		expect(html).toMatchSnapshot();
	});

	it('matches the template snapshot', async () => {
		const template = await renderNewsletterTemplate();

		expect(template).toMatchSnapshot();
	});
});
