import { defineField } from 'sanity';

export const excerptField = defineField({
	title: 'Vorschautext',
	name: 'excerpt',
	type: 'text',
	description: 'Kurze Beschreibung, die auf den Übersichtsseiten angezeigt wird.',
	group: 'excerpt',
	validation: Rule => [
		Rule.required().error('Der Vorschautext ist erforderlich'),
		Rule.min(130)
			.max(160)
			.warning('Der Vorschautext sollte idealerweise von 130 bis 160 Zeichen lang sein.'),
	],
});

export const featuredImageField = defineField({
	title: 'Vorschaubild',
	name: 'featuredImage',
	type: 'mainImage',
	description: 'Bild, das in Beitragslisten angezeigt wird.',
	group: 'excerpt',
	validation: Rule => [Rule.required().error('Das Vorschaubild ist erforderlich')],
});
