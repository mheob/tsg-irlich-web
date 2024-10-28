import { defineField } from 'sanity';

import { requiredRule } from '../validation-rules';

export const excerptField = defineField({
	title: 'Vorschautext',
	name: 'excerpt',
	type: 'text',
	description:
		'Kurze Beschreibung, die auf den Übersichtsseiten angezeigt wird und wenn Leute deinen Beitrag auf sozialen Medien teilen.',
	group: 'excerpt',
	validation: rule => [requiredRule(rule, 'Der Vorschautext')],
});

export const featuredImageField = defineField({
	title: 'Vorschaubild',
	name: 'featuredImage',
	type: 'mainImage',
	description: 'Bild, das in Beitragslisten angezeigt wird.',
	group: 'excerpt',
	validation: rule => [requiredRule(rule, 'Das Vorschaubild')],
});
