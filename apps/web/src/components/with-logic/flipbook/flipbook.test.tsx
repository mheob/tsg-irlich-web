import type {
	BookSnapshot,
	FlipBookHandle,
	HTMLFlipBookProps,
	PageFlip,
} from '@gullabs/react-flipbook';
import { act, within } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import type { ForwardedRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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

/** The size every element reports, the book's box and each page alike. */
const PAGE_BOX = new DOMRect(0, 0, 400, 566);

/**
 * Makes `document.elementsFromPoint`, which jsdom lacks, report the given elements at any point.
 *
 * @param elements - The elements under the pointer, topmost first.
 */
function stubElementsFromPoint(...elements: Element[]): void {
	Object.defineProperty(document, 'elementsFromPoint', {
		configurable: true,
		value: () => elements,
	});
}

/**
 * The enlarged page inside the lens. The lens repeats what the page shows, so it is hidden from
 * assistive technology.
 *
 * @param container - The rendered book.
 * @returns The image, or `null` without a lens.
 */
function lensImage(container: HTMLElement): HTMLElement | null {
	return within(container).queryByRole('presentation', { hidden: true });
}

describe('the lens', () => {
	afterEach(() => {
		Reflect.deleteProperty(document, 'elementsFromPoint');
		vi.restoreAllMocks();
	});

	it('starts switched off and leaves the pointer to the book', () => {
		const { getByRole } = renderBook();

		expect(getByRole('button', { name: 'Lupe' }).getAttribute('aria-pressed')).toBe('false');
		expect(bookProps().pointerInput).toBeUndefined();
	});

	// A click or a drag meant for the lens must not turn the page under it.
	it('takes the page turns away from the pointer while it is on', async () => {
		const { getByRole, user } = renderBook();
		const lens = getByRole('button', { name: 'Lupe' });

		await user.click(lens);

		expect(lens.getAttribute('aria-pressed')).toBe('true');
		expect(bookProps().pointerInput).toStrictEqual([]);

		await user.click(lens);

		expect(lens.getAttribute('aria-pressed')).toBe('false');
		expect(bookProps().pointerInput).toBeUndefined();
	});

	it('shows the page under the mouse enlarged', async () => {
		vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(PAGE_BOX);
		const { container, getByAltText, getByRole, user } = renderBook();
		const page = getByAltText('Seite 2 von 3');
		stubElementsFromPoint(page);

		await user.click(getByRole('button', { name: 'Lupe' }));
		await user.pointer({ coords: { clientX: 100, clientY: 200 }, target: page });

		expect(lensImage(container)?.getAttribute('src')).toBe(PAGES[1]?.src);
		expect(lensImage(container)?.style.width).toBe('1000px');
		expect(lensImage(container)?.style.left).toBe('calc(50% - 250px)');
	});

	it('follows a finger that touches the page', async () => {
		vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(PAGE_BOX);
		const { container, getByAltText, getByRole, user } = renderBook();
		const page = getByAltText('Seite 3 von 3');
		stubElementsFromPoint(page);

		await user.click(getByRole('button', { name: 'Lupe' }));
		await user.pointer({ coords: { clientX: 10, clientY: 20 }, keys: '[TouchA>]', target: page });

		expect(lensImage(container)?.getAttribute('src')).toBe(PAGES[2]?.src);
	});

	it('shows nothing while it is off', async () => {
		const { container, getByAltText, user } = renderBook();
		const page = getByAltText('Seite 1 von 3');
		stubElementsFromPoint(page);

		await user.pointer({ coords: { clientX: 100, clientY: 200 }, target: page });

		expect(lensImage(container)).toBeNull();
	});

	it('shows nothing beside the pages', async () => {
		const { container, getByAltText, getByRole, user } = renderBook();
		stubElementsFromPoint();

		await user.click(getByRole('button', { name: 'Lupe' }));
		await user.pointer({
			coords: { clientX: 5, clientY: 5 },
			target: getByAltText('Seite 1 von 3'),
		});

		expect(lensImage(container)).toBeNull();
	});

	it('disappears when the pointer leaves the book', async () => {
		const { container, getByAltText, getByRole, user } = renderBook();
		const page = getByAltText('Seite 1 von 3');
		const toggle = getByRole('button', { name: 'Lupe' });
		stubElementsFromPoint(page);
		await user.click(toggle);
		await user.pointer({ target: page });

		expect(lensImage(container)).not.toBeNull();

		await user.pointer({ target: toggle });

		expect(lensImage(container)).toBeNull();
	});

	// Switched on again, a lens left over from before would sit where the pointer no longer is.
	it('disappears with its switch and stays away until the pointer moves', async () => {
		const { container, getByAltText, getByRole, user } = renderBook();
		const page = getByAltText('Seite 1 von 3');
		const toggle = getByRole('button', { name: 'Lupe' });
		stubElementsFromPoint(page);
		await user.click(toggle);
		await user.pointer({ target: page });

		toggle.focus();
		await user.keyboard(' ');

		expect(lensImage(container)).toBeNull();

		await user.keyboard(' ');

		expect(lensImage(container)).toBeNull();
	});
});
