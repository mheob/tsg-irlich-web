import { defineField } from 'sanity';

import { getRequiredRole } from './validation-rules';

export const excerptField = defineField({
	title: 'Excerpt',
	name: 'excerpt',
	type: 'simpleBlockContent',
	description:
		'Kurze Beschreibung, die auf den Übersichtsseiten angezeigt wird und wenn Leute deinen Beitrag auf sozialen Medien teilen.',
	group: 'excerpt',
	validation: rule => [getRequiredRole(rule, 'Excerpt')],
});

export const featuredImageField = defineField({
	title: 'Vorschaubild',
	name: 'featuredImage',
	type: 'mainImage',
	description: 'Bild, das in Beitragslisten angezeigt wird.',
	group: 'excerpt',
});
