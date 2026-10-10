import type {
	BookSnapshot,
	FlipBookHandle,
	HTMLFlipBookProps,
	PageFlip,
} from '@gullabs/react-flipbook';
import { act } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import type { ForwardedRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { renderWithUser } from '../../../../test-utils/render';
import { Flipbook } from './flipbook';

const book = vi.hoisted(() => ({
	flipNext: vi.fn(() => true),
	flipPrev: vi.fn(() => true),
	pageFlip: vi.fn<() => PageFlip | null>(() => null),
	render: vi.fn<(props: HTMLFlipBookProps) => void>(),
}));

/**
 * Stands in for the engine: reports its props and hands out the fake turns.
 *
 * @param props - The props the wrapper passes.
 * @param ref - The wrapper's handle on the book.
 * @returns The leaves.
 */
function FakeFlipBook(props: HTMLFlipBookProps, ref: ForwardedRef<FlipBookHandle | null>) {
	book.render(props);
	useImperativeHandle(ref, () => book as unknown as FlipBookHandle);
	return <div>{props.children}</div>;
}

// The engine draws on a canvas-like layout jsdom cannot measure. The fake reports the props the
// wrapper hands it, renders the leaves, and exposes the two turns the wrapper's buttons call.
vi.mock(import('@gullabs/react-flipbook'), () => ({ HTMLFlipBook: forwardRef(FakeFlipBook) }));

/**
 * The props the wrapper handed the book on its last render.
 *
 * @returns The props, empty before the first render.
 */
function bookProps(): Partial<HTMLFlipBookProps> {
	return book.render.mock.lastCall?.[0] ?? {};
}

const PAGES = [1, 2, 3].map((n) => ({
	alt: `Seite ${n} von 3`,
	id: `page-${n}`,
	src: `https://cdn.sanity.io/images/p/d/page-${n}.jpg?w=1600`,
	srcSet: `https://cdn.sanity.io/images/p/d/page-${n}.jpg?w=800 800w`,
}));

function snapshot(visiblePages: number[]): BookSnapshot {
	return { orientation: 'landscape', page: visiblePages[0] ?? 0, pageCount: 3, visiblePages };
}

function renderBook() {
	return renderWithUser(
		<Flipbook
			label="TSG ECHO 2025 zum Durchblättern"
			pageHeight={2000}
			pageWidth={1414}
			pages={PAGES}
		/>,
	);
}

describe('the flipbook', () => {
	it('shows every page under its position', () => {
		const { getAllByRole } = renderBook();

		expect(getAllByRole('img').map((image) => image.getAttribute('alt'))).toStrictEqual([
			'Seite 1 von 3',
			'Seite 2 von 3',
			'Seite 3 von 3',
		]);
	});

	it('names the book for assistive technology', () => {
		renderBook();

		expect(bookProps()).toMatchObject({
			'aria-label': 'TSG ECHO 2025 zum Durchblättern',
			roleDescription: 'Heft',
		});
	});

	it('turns without animation when the reader asked for reduced motion', () => {
		renderBook();

		expect(bookProps().respectReducedMotion).toBe(true);
	});

	it('lets the arrow keys turn the page', () => {
		renderBook();

		expect(bookProps().useKeyboard).toBe(true);
	});

	it('mounts only the spreads around the current one', () => {
		renderBook();

		expect(bookProps().lazyRadius).toBe(2);
	});

	// Review focus 4: at the cover there is no way back, and the indicator names one page.
	it('starts at the cover with the way back blocked', () => {
		const { getByRole, getByText } = renderBook();
		act(() => bookProps().onLoaded?.(snapshot([0])));

		expect(getByText('Seite 1 von 3')).toHaveProperty('ariaLive', 'polite');
		expect(getByRole('button', { name: 'Vorherige Seite' }).getAttribute('aria-disabled')).toBe(
			'true',
		);
		expect(getByRole('button', { name: 'Nächste Seite' }).getAttribute('aria-disabled')).toBe(
			'false',
		);
	});

	// A natively disabled button would drop the keyboard focus to the page at either end.
	it('keeps a blocked button focusable but lets it do nothing', async () => {
		const { getByRole, user } = renderBook();
		act(() => bookProps().onLoaded?.(snapshot([0])));
		const previous = getByRole('button', { name: 'Vorherige Seite' });

		await user.click(previous);

		expect(previous).toHaveProperty('disabled', false);
		expect(book.flipPrev).not.toHaveBeenCalled();
	});

	it('follows the book to the last spread and blocks the way forward', () => {
		const { getByRole, getByText } = renderBook();
		act(() => bookProps().onPageChange?.(snapshot([1, 2])));

		expect(getByText('Seiten 2–3 von 3')).toBeDefined();
		expect(getByRole('button', { name: 'Nächste Seite' }).getAttribute('aria-disabled')).toBe(
			'true',
		);
		expect(getByRole('button', { name: 'Vorherige Seite' }).getAttribute('aria-disabled')).toBe(
			'false',
		);
	});

	// Review focus 4: turning a phone swaps a spread for a single page without a page turn.
	it('re-reads what is on screen when the book changes its orientation', () => {
		const { getByText } = renderBook();
		act(() => bookProps().onPageChange?.(snapshot([1, 2])));
		book.pageFlip.mockReturnValue({
			getPageCount: () => 3,
			getVisiblePages: () => [1],
		} as unknown as PageFlip);

		act(() => bookProps().onChangeOrientation?.({ orientation: 'portrait' }));

		expect(getByText('Seite 2 von 3')).toBeDefined();
	});

	// Sanity stores identical uploads once, so two blank pages of a scan share one image URL.
	it('keeps two identical pages apart', () => {
		const error = vi.spyOn(console, 'error');
		const [blank] = PAGES;

		renderWithUser(
			<Flipbook
				label="TSG ECHO 2025 zum Durchblättern"
				pageHeight={2000}
				pageWidth={1414}
				pages={[blank, { ...blank, id: 'another-blank' }]}
			/>,
		);

		expect(error).not.toHaveBeenCalled();
	});

	it('turns the book with its own buttons', async () => {
		const { getByRole, user } = renderBook();
		act(() => bookProps().onLoaded?.(snapshot([0])));

		await user.click(getByRole('button', { name: 'Nächste Seite' }));

		expect(book.flipNext).toHaveBeenCalledOnce();
	});
});
