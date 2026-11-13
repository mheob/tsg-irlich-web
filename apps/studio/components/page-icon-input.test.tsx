import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { renderToStaticMarkup } from 'react-dom/server';
import type { StringInputProps } from 'sanity';
import { describe, expect, it } from 'vite-plus/test';

import { PAGE_ICONS } from '@tsgi-web/shared/page-icons';

import { PageIconInput, PageIconPreview } from './page-icon-input';

const THEME = buildTheme();

/**
 * Renders the input of an icon field with a stand-in for the studio's own select.
 *
 * @param value - The stored icon value.
 * @returns The markup.
 */
function renderInput(value?: string): string {
	const props = {
		renderDefault: () => <select aria-label="Icon" />,
		value,
	} as unknown as StringInputProps;

	return renderToStaticMarkup(
		<ThemeProvider theme={THEME}>
			<PageIconInput {...props} />
		</ThemeProvider>,
	);
}

describe('the preview of a page icon', () => {
	it.each(PAGE_ICONS.map(({ value }) => value))('draws an icon for %s', (icon) => {
		expect(renderToStaticMarkup(<PageIconPreview icon={icon} />)).toMatch(/^<svg/u);
	});

	it('draws each icon with its own shape', () => {
		expect(renderToStaticMarkup(<PageIconPreview icon="users" />)).not.toBe(
			renderToStaticMarkup(<PageIconPreview icon="heart" />),
		);
	});

	it.each(['unbekannt', undefined])('draws nothing for %s', (icon) => {
		expect(renderToStaticMarkup(<PageIconPreview icon={icon} />)).toBe('');
	});
});

describe('the input of a page icon', () => {
	it('shows the chosen icon next to the select', () => {
		const markup = renderInput('graduation-cap');

		expect(markup).toContain('<svg');
		expect(markup).toContain('<select aria-label="Icon">');
	});

	it('keeps the select alone while no icon is chosen', () => {
		const markup = renderInput();

		expect(markup).not.toContain('<svg');
		expect(markup).toContain('<select aria-label="Icon">');
	});
});
