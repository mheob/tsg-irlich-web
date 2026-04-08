import { defineField } from 'sanity';

export const contentField = defineField({
	description: 'Abschnitte mit Inhalt hinzufügen, bearbeiten und neu anordnen.',
	group: 'content',
	name: 'body',
	of: [{ type: 'grid' }, { type: 'mainImage' }, { type: 'blockContent' }, { type: 'spacer' }],
	title: 'Abschnitte',
	type: 'array',
});
