import { defineField } from 'sanity';

export const authorField = defineField({
	description: 'Autor für Beitrag auswählen',
	group: 'meta',
	name: 'author',
	title: 'Autor',
	to: [{ type: 'author' }],
	type: 'reference',
	validation: rule => rule.required(),
});

export const metaField = defineField({
	group: 'meta',
	name: 'meta',
	title: 'Meta',
	type: 'metaFields',
});

export const publishedAtField = defineField({
	group: 'meta',
	name: 'publishedAt',
	title: 'Veröffentlicht am',
	type: 'datetime',
	validation: rule => rule.required(),
});
