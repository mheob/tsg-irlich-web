import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';

import { DOSB_ICONS_SET } from '@tsgi-web/shared';

import { CLUB_ICON_NAMES, getPreviewIcon } from './preview-icon';

/**
 * Renders the preview icon of a stored name to markup.
 *
 * @param icon - The stored icon name.
 * @returns The markup, or `undefined` when the name yields no icon.
 */
function renderIcon(icon?: string): string | undefined {
	const element = getPreviewIcon(icon);
	return element ? renderToStaticMarkup(element) : undefined;
}

describe('preview icon', () => {
	it('draws a DOSB pictogram one em in size, like the Remix icons next to it', () => {
		const markup = renderIcon('Fussball');

		expect(markup).toMatch(/^<svg/u);
		expect(markup).toContain('width="1em"');
		expect(markup).toContain('height="1em"');
	});

	it('draws every club icon', () => {
		for (const name of CLUB_ICON_NAMES) {
			expect(renderIcon(name)).toMatch(/^<svg/u);
		}
	});

	it('draws each club icon with its own shape', () => {
		expect(renderIcon('Gesamtverein')).not.toBe(renderIcon('Presse'));
	});

	// The studio then shows the icon of the document type instead.
	it('returns nothing for a missing or unknown name', () => {
		expect(getPreviewIcon()).toBeUndefined();
		expect(getPreviewIcon('')).toBeUndefined();
		expect(getPreviewIcon('Schach')).toBeUndefined();
	});

	it('keeps the club icons apart from the DOSB names, so a stored value is never ambiguous', () => {
		for (const name of CLUB_ICON_NAMES) {
			expect(DOSB_ICONS_SET.has(name)).toBe(false);
		}
	});
});
