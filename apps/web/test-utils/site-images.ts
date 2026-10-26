/**
 * An image of the site settings with a file, in the `image-<id>-<width>x<height>-<format>` shape
 * `@sanity/image-url` requires.
 *
 * @param alt - The alt text.
 * @param id - The asset id, findable in the resulting URL.
 * @returns The image as an item of a list field.
 */
function siteImage(alt: string, id: string): SiteImage {
	return {
		_key: id,
		_type: 'extendedImage' as const,
		alt,
		asset: { _ref: `image-${id}-600x600-webp`, _type: 'reference' as const },
	};
}

/** An item of a list of images in the site settings. */
interface SiteImage {
	_key: string;
	_type: 'extendedImage';
	alt: string;
	asset: { _ref: string; _type: 'reference' };
}

/** The images of the site settings as `siteImagesQuery` returns them. */
const SITE_IMAGES = {
	contactFormImages: [
		siteImage('Spielerin am Telefon', 'contact1aaa'),
		siteImage('Mannschaftsfoto', 'contact2bbb'),
		siteImage('PR-Team bei der Arbeit', 'contact3ccc'),
	],
	fallbackImage: {
		_type: 'extendedImage' as const,
		alt: 'Sporthalle',
		asset: { _ref: 'image-fallback999-4094x2160-webp', _type: 'reference' as const },
	},
	visionImages: [
		siteImage('Scheck-Übergabe', 'vision1aaa'),
		siteImage('Tanzgruppe', 'vision2bbb'),
		siteImage('Jugendmannschaft', 'vision3ccc'),
	],
};

export { SITE_IMAGES };
