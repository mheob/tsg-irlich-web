import type { CSSProperties } from 'react';

/** The narrowest a page gets before the book stops shrinking. */
const MIN_PAGE_WIDTH = 240;

/** The widest the book gets, a spread on a large screen. */
const MAX_BOOK_WIDTH = '64rem';

/**
 * What has to fit on screen next to the book: the fixed bar once the page is scrolled (4rem), the
 * gap and the controls below the book (1.5rem and 3rem) and some air above and below it (2rem).
 */
const BOOK_CHROME = '10.5rem';

/**
 * The aspect ratios of a page and of a spread, and the widest each may get, as custom properties for
 * the box the book takes. The width follows from the height left on screen, so the controls below
 * the book stay in view on a wide but low screen (WEB-436). Neither gets narrower than the engine's
 * smallest page: below that the book would switch to single pages and grow taller instead.
 *
 * @param pageWidth - The width of a page in pixels.
 * @param pageHeight - The height of a page in pixels.
 * @returns The custom properties.
 */
function getBookStyle(pageWidth: number, pageHeight: number): BookStyle {
	const height = `(100svh - ${BOOK_CHROME})`;
	return {
		'--echo-page': `${pageWidth} / ${pageHeight}`,
		'--echo-page-max': `max(${MIN_PAGE_WIDTH}px, ${height} * ${pageWidth / pageHeight})`,
		'--echo-spread': `${pageWidth * 2} / ${pageHeight}`,
		'--echo-spread-max': `max(${MIN_PAGE_WIDTH * 2}px, min(${MAX_BOOK_WIDTH}, ${height} * ${(pageWidth * 2) / pageHeight}))`,
	};
}

/** The custom properties of the book's box. */
type BookStyle = CSSProperties &
	Record<'--echo-page' | '--echo-page-max' | '--echo-spread' | '--echo-spread-max', string>;

export { getBookStyle, MIN_PAGE_WIDTH };
