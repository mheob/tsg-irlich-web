// oxlint-disable no-magic-numbers

import { defineField } from 'sanity';

const excerptField = defineField({
	description: 'Kurze Beschreibung, die auf den Übersichtsseiten angezeigt wird.',
	group: 'excerpt',
	name: 'excerpt',
	title: 'Vorschautext',
	type: 'text',
	validation: (Rule) => [
		Rule.required().error('Der Vorschautext ist erforderlich'),
		Rule.min(130)
			.max(160)
			.warning('Der Vorschautext sollte idealerweise von 130 bis 160 Zeichen lang sein.'),
	],
});

const featuredImageField = defineField({
	description: 'Bild, das in Beitragslisten angezeigt wird.',
	group: 'excerpt',
	name: 'featuredImage',
	title: 'Vorschaubild',
	type: 'mainImage',
	validation: (Rule) => [Rule.required().error('Das Vorschaubild ist erforderlich')],
});

export { excerptField, featuredImageField };
