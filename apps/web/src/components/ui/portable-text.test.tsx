import { render } from '@testing-library/react';
import type { PortableTextBlock } from 'next-sanity';
import { describe, expect, it, vi } from 'vitest';

import { PortableText } from './portable-text';
import type { PortableTextValue } from './portable-text';

/** Minimal shape of a mark definition, matching what `internalLink`/`externalLink` need. */
interface MarkDef {
	_key: string;
	_type: string;
	[key: string]: unknown;
}

function textBlock(
	key: string,
	text: string,
	style: PortableTextBlock['style'] = 'normal',
): PortableTextBlock {
	return {
		_key: key,
		_type: 'block',
		children: [{ _key: `${key}-span`, _type: 'span', marks: [], text }],
		markDefs: [],
		style,
	};
}

function markedBlock(key: string, text: string, markDef: MarkDef): PortableTextBlock {
	return {
		_key: key,
		_type: 'block',
		children: [{ _key: `${key}-span`, _type: 'span', marks: [markDef._key], text }],
		markDefs: [markDef],
		style: 'normal',
	};
}

function renderPortableText(value: PortableTextValue) {
	return render(<PortableText value={value} />);
}

describe('portable text', () => {
	it('renders a blockquote block as a blockquote element', () => {
		const { getByText } = renderPortableText([textBlock('bq', 'Ein Zitat.', 'blockquote')]);

		const quote = getByText('Ein Zitat.');
		expect(quote.closest('blockquote')).not.toBeNull();
	});

	it('renders an h2 block as a heading with an anchor link to its own key', () => {
		const { getByRole } = renderPortableText([textBlock('section-1', 'Abschnitt', 'h2')]);

		const heading = getByRole('heading', { level: 2, name: 'Abschnitt' });
		expect(heading.id).toBe('section-1');

		const anchor = getByRole('link', { name: 'Zum Abschnitt springen' });
		expect(anchor.getAttribute('href')).toBe('#section-1');
	});

	it('renders an h3 block as a heading with an anchor link to its own key', () => {
		const { getByRole } = renderPortableText([textBlock('section-2', 'Unterabschnitt', 'h3')]);

		const heading = getByRole('heading', { level: 3, name: 'Unterabschnitt' });
		expect(heading.id).toBe('section-2');

		const anchor = getByRole('link', { name: 'Zum Abschnitt springen' });
		expect(anchor.getAttribute('href')).toBe('#section-2');
	});

	it('renders a bullet list block as a ul with a li per item', () => {
		const { getByRole } = renderPortableText([
			{ ...textBlock('item-1', 'Erster Punkt'), level: 1, listItem: 'bullet' },
			{ ...textBlock('item-2', 'Zweiter Punkt'), level: 1, listItem: 'bullet' },
		]);

		const list = getByRole('list');
		expect(list.tagName).toBe('UL');
		const items = list.querySelectorAll('li');
		expect(items).toHaveLength(2);
		expect(items[0]?.textContent).toBe('Erster Punkt');
		expect(items[1]?.textContent).toBe('Zweiter Punkt');
	});

	it('renders a numbered list block as an ol with a li per item', () => {
		const { getByRole } = renderPortableText([
			{ ...textBlock('num-1', 'Erster Schritt'), level: 1, listItem: 'number' },
			{ ...textBlock('num-2', 'Zweiter Schritt'), level: 1, listItem: 'number' },
		]);

		const list = getByRole('list');
		expect(list.tagName).toBe('OL');
		const items = list.querySelectorAll('li');
		expect(items).toHaveLength(2);
		expect(items[0]?.textContent).toBe('Erster Schritt');
		expect(items[1]?.textContent).toBe('Zweiter Schritt');
	});

	it('resolves an internal link mark to the href built by getInternalHref', () => {
		const { getByRole } = renderPortableText([
			markedBlock('int', 'Zu den News', {
				_key: 'int-mark',
				_type: 'internalLink',
				target: { _type: 'news.category', slug: 'aktuelles' },
			}),
		]);

		const link = getByRole('link', { name: 'Zu den News' });
		expect(link.getAttribute('href')).toBe('/news/aktuelles');
	});

	it('renders no link for an internal link mark whose target does not resolve', () => {
		const { getByText, queryByRole } = renderPortableText([
			markedBlock('int-broken', 'Toter Link', {
				_key: 'int-mark-broken',
				_type: 'internalLink',
				target: null,
			}),
		]);

		expect(queryByRole('link')).toBeNull();
		expect(getByText('Toter Link')).not.toBeNull();
	});

	it('renders an external link mark with rel and target for a new tab', () => {
		const { getByRole } = renderPortableText([
			markedBlock('ext', 'TSG Sponsoren', {
				_key: 'ext-mark',
				_type: 'externalLink',
				href: 'https://sponsor.example.com',
			}),
		]);

		const link = getByRole('link', { name: 'TSG Sponsoren (öffnet in neuem Tab)' });
		expect(link.getAttribute('href')).toBe('https://sponsor.example.com');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		expect(link.getAttribute('target')).toBe('_blank');
	});

	it('does not crash rendering an unknown block type', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockReturnValue();

		expect(() =>
			renderPortableText([{ _key: 'callout-1', _type: 'callout', text: 'Achtung!' }]),
		).not.toThrow();

		warnSpy.mockRestore();
	});

	it('does not render an alt-accessible image for an image block (no `types.image` component is registered)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockReturnValue();

		const { queryByAltText, queryByRole } = renderPortableText([
			{
				_key: 'image-1',
				_type: 'image',
				alt: 'Gruppenfoto beim Training',
				asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' },
			},
		]);

		expect(queryByRole('img')).toBeNull();
		expect(queryByAltText('Gruppenfoto beim Training')).toBeNull();

		warnSpy.mockRestore();
	});

	it('warns about an unresolvable internal link while developing', () => {
		vi.stubEnv('NODE_ENV', 'development');
		const warnSpy = vi.spyOn(console, 'warn').mockReturnValue();

		renderPortableText([
			markedBlock('int-dev', 'Toter Link', {
				_key: 'int-mark-dev',
				_type: 'internalLink',
				target: null,
			}),
		]);

		expect(warnSpy).toHaveBeenCalledWith(
			'Internal link without a resolvable target:',
			expect.anything(),
		);

		warnSpy.mockRestore();
		vi.unstubAllEnvs();
	});

	// The `link` mark maps to an `async` component in `portable-text.tsx` (it awaits nothing, but the
	// signature makes it one), and React cannot render an async component on the client — the tree
	// suspends forever and the container stays empty. Its three branches (a path or the club domain
	// stays in the app, an external target opens in a new tab, a mark without a target renders plain
	// text) are therefore not reachable from a test; the `externalLink` mark above covers the same
	// shape for the mark the CMS actually writes.
});
