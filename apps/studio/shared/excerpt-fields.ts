import { defineField } from 'sanity';

export const excerptField = defineField({
	description:
		'Kurze Beschreibung, die auf den Übersichtsseiten angezeigt wird und wenn Leute deinen Beitrag auf sozialen Medien teilen.',
	group: 'excerpt',
	name: 'excerpt',
	title: 'Excerpt',
	type: 'simpleBlockContent',
	validation: rule => rule.required(),
});

export const featuredImageField = defineField({
	description: 'Bild, das in Beitragslisten angezeigt wird.',
	group: 'excerpt',
	name: 'featuredImage',
	title: 'Vorschaubild',
	type: 'mainImage',
});
