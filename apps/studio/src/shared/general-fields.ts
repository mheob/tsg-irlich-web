import { defineField } from 'sanity';
import slug from 'slugify';

export const slugField = defineField({
	description: 'Ein Slug muss gesetzt werden, um die Seite anzeigen zu können.',
	group: 'general',
	name: 'slug',
	options: {
		slugify: (input: string) => slug(input, { lower: true, trim: true }),
		source: 'title',
	},
	title: 'Slug',
	type: 'slug',
	validation: rule => rule.required().error('Slug ist erforderlich.'),
});

export const titleField = defineField({
	group: 'general',
	name: 'title',
	title: 'Title',
	type: 'string',
	validation: rule => [
		rule.required().min(3).error('Der Titel muss mindestens 3 Zeichen lang sein.'),
		rule.min(55).max(65).warning('Der Titel sollte idealerweise von 55 bis 65 Zeichen lang sein.'),
	],
});
