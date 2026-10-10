import type { FlipBookHandle, HTMLFlipBookProps } from '@gullabs/react-flipbook';
import { forwardRef } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { FlipbookLazy } from './flipbook-lazy';

/**
 * Stands in for the engine and renders the leaves.
 *
 * @param props - The props the wrapper passes.
 * @returns The leaves.
 */
function FakeFlipBook(props: HTMLFlipBookProps) {
	return <div>{props.children}</div>;
}

vi.mock(import('@gullabs/react-flipbook'), () => ({
	HTMLFlipBook: forwardRef<FlipBookHandle | null, HTMLFlipBookProps>(FakeFlipBook),
}));

const COVER = {
	alt: 'Titelseite von TSG ECHO 2025',
	id: 'cover',
	src: 'https://cdn.sanity.io/c.jpg',
	srcSet: '',
};
const PAGES = [
	{ alt: 'Seite 1 von 1', id: 'page-1', src: 'https://cdn.sanity.io/p.jpg', srcSet: '' },
];

function lazyBook() {
	return (
		<FlipbookLazy
			cover={COVER}
			label="TSG ECHO 2025 zum Durchblättern"
			pageHeight={2000}
			pageWidth={1414}
			pages={PAGES}
		/>
	);
}

describe('the lazily loaded flipbook', () => {
	// Review focus 5: without JavaScript a reader still sees the cover; the PDF sits next to it.
	it('renders only the cover on the server', () => {
		const html = renderToString(lazyBook());

		expect(html).toContain('alt="Titelseite von TSG ECHO 2025"');
		expect(html).not.toContain('Nächste Seite');
	});

	it('replaces the cover with the book in the browser', async () => {
		// Load the chunk first: under a full parallel coverage run its first import alone outlasted
		// `findByRole`'s one second, while the lazy boundary itself resolves at once from the cache.
		await import('./flipbook');
		const { findByRole, queryByAltText } = renderWithUser(lazyBook());

		await findByRole('button', { name: 'Nächste Seite' });

		expect(queryByAltText('Titelseite von TSG ECHO 2025')).toBeNull();
	});

	it('reserves the shape of a page and of a spread before the book loads', () => {
		const { container } = renderWithUser(lazyBook());

		expect(container.firstElementChild?.getAttribute('style')).toContain(
			'--echo-page: 1414 / 2000',
		);
		expect(container.firstElementChild?.getAttribute('style')).toContain(
			'--echo-spread: 2828 / 2000',
		);
	});
});
