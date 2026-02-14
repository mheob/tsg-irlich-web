import { defineField } from 'sanity';

export const authorField = defineField({
	title: 'Autor',
	name: 'author',
	type: 'reference',
	to: [{ type: 'author' }],
	description: 'Autor für Beitrag auswählen',
	group: 'meta',
	validation: (Rule) => [Rule.required().error('Der Autor ist erforderlich')],
});

export const metaField = defineField({
	title: 'Meta',
	name: 'meta',
	type: 'metaFields',
	group: 'meta',
});
