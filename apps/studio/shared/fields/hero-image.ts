import { defineField } from 'sanity';

/** How the banner of every page except home treats its image, for the field description. */
const LANDSCAPE_HERO_DESCRIPTION =
	'Querformat. Das Banner zeigt je nach Bildschirm nur einen Teil des Bildes, der Hotspot bestimmt, welcher Teil sichtbar bleibt. Ohne eigenes Open-Graph-Bild dient es auch als Vorschaubild beim Teilen.';

/**
 * The required hero image of a single page, shown at the top of the page next to its title.
 *
 * @param description - Tells the editors what kind of image the page needs and where else it appears.
 * @returns The `heroImage` field in the general group.
 */
function getHeroImageField(description: string): ReturnType<typeof defineField> {
	return defineField({
		description,
		group: 'general',
		name: 'heroImage',
		title: 'Hero-Bild',
		type: 'extendedImage',
		validation: (Rule) => Rule.required().assetRequired().error('Das Hero-Bild ist erforderlich'),
	});
}

export { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION };
