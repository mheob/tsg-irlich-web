import { defineField } from 'sanity';

export const contentField = defineField({
	title: 'Abschnitte',
	name: 'body',
	type: 'array',
	of: [{ type: 'grid' }, { type: 'mainImage' }, { type: 'blockContent' }, { type: 'spacer' }],
	description: 'Abschnitte mit Inhalt hinzufügen, bearbeiten und neu anordnen.',
	group: 'content',
});
