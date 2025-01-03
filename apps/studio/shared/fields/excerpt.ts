import { defineField } from 'sanity';

export const excerptField = defineField({
	title: 'Vorschautext',
	name: 'excerpt',
	type: 'text',
	description:
		'Kurze Beschreibung, die auf den Übersichtsseiten angezeigt wird und wenn Leute deinen Beitrag auf sozialen Medien teilen.',
	group: 'excerpt',
	validation: Rule => [Rule.required().error('Der Vorschautext ist erforderlich')],
});

export const featuredImageField = defineField({
	title: 'Vorschaubild',
	name: 'featuredImage',
	type: 'mainImage',
	description: 'Bild, das in Beitragslisten angezeigt wird.',
	group: 'excerpt',
	validation: Rule => [Rule.required().error('Das Vorschaubild ist erforderlich')],
});
