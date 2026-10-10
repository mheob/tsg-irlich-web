/** One page of a flipbook, with the image widths the Sanity CDN delivers. */
interface FlipbookPage {
	alt: string;
	/** Unique within the book. Two blank pages of a scan share their image, so `src` is not. */
	id: string;
	src: string;
	srcSet: string;
}

export type { FlipbookPage };
