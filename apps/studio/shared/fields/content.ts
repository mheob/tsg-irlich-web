import { defineArrayMember, defineField } from '@sanity-typed/types';

export const contentField = defineField({
	title: 'Abschnitte',
	name: 'body',
	type: 'array',
	of: [
		defineArrayMember({ type: 'grid' }),
		defineArrayMember({ type: 'mainImage' }),
		defineArrayMember({ type: 'blockContent' }),
		defineArrayMember({ type: 'spacer' }),
	],
	description: 'Abschnitte mit Inhalt hinzufügen, bearbeiten und neu anordnen.',
	group: 'content',
});
