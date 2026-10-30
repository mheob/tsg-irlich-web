import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { SearchThumbnail } from './search-thumbnail';

// The central setup swaps `next/image` for a plain `<img>` that drops `unoptimized`. This file is
// about exactly that prop, so it brings the real component back: whether the browser is pointed at
// the optimizer or at the given URL is what the `src` of the rendered image shows.
vi.mock(import('next/image'), async (importOriginal) => importOriginal());

describe('the thumbnail of a hit', () => {
	it('shows the image without an alternative text, as the title next to it names the hit', () => {
		const { container } = renderWithUser(
			<SearchThumbnail thumbnail={{ src: '/images/halle.jpg', unoptimized: false }} />,
		);

		const image = container.querySelector('img');
		expect(image?.getAttribute('alt')).toBe('');
	});

	it('serves an image through the optimizer by default', () => {
		const { container } = renderWithUser(
			<SearchThumbnail thumbnail={{ src: '/images/halle.jpg', unoptimized: false }} />,
		);

		expect(container.querySelector('img')?.getAttribute('src')).toMatch(
			/^\/_next\/image\?url=%2Fimages%2Fhalle\.jpg&/u,
		);
	});

	it('bypasses the optimizer for a cover that search engines must not find', () => {
		const { container } = renderWithUser(
			<SearchThumbnail thumbnail={{ src: '/echo-archiv/images/cover.jpg', unoptimized: true }} />,
		);

		expect(container.querySelector('img')?.getAttribute('src')).toBe(
			'/echo-archiv/images/cover.jpg',
		);
	});

	it('shows the club logo on a plain box when the hit has no image', () => {
		const { container } = renderWithUser(<SearchThumbnail thumbnail={null} />);

		expect(container.querySelector('img')).toBeNull();
		expect(container.querySelector('svg')).not.toBeNull();
	});
});
