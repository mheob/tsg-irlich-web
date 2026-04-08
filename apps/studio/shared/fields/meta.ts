import { defineField } from 'sanity';

const authorField = defineField({
	description: 'Autor für Beitrag auswählen',
	group: 'meta',
	name: 'author',
	title: 'Autor',
	to: [{ type: 'author' }],
	type: 'reference',
	validation: (Rule) => [Rule.required().error('Der Autor ist erforderlich')],
});

const metaField = defineField({
	group: 'meta',
	name: 'meta',
	title: 'Meta',
	type: 'metaFields',
});

export { authorField, metaField };
