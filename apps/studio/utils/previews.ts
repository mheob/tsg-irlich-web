/**
 * The list preview of a single page: a fixed label, with the page's own `title` selected. The
 * studio search weighs a field by its place in `preview.select`, so without it the title of a
 * single page counted 1 against 10 for a news title, and the page fell out of the reference search
 * (WEB-369).
 *
 * @param label - The label the page carries in lists, e.g. `TSG-Echo Übersicht`.
 * @returns The `preview` of the document type.
 */
function getSinglePagePreview(label: string): SinglePagePreview {
	return {
		prepare: () => ({ title: label }),
		select: { title: 'title' },
	};
}

interface SinglePagePreview {
	prepare: () => { title: string };
	select: { title: 'title' };
}

export { getSinglePagePreview };
