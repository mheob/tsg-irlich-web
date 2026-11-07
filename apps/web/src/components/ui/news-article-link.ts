/**
 * The title link of a news card. Its `::after` stretches over the whole card (the `relative`
 * `<article>`), so the card has a single link to the article: one tab stop, named by the title,
 * while a click on the image or the text still opens the article. The focus ring is drawn on that
 * overlay, around the card, because the title alone would not show what the link covers.
 */
export const ARTICLE_LINK_CLASS_NAME =
	'outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2';
