import { defineField } from 'sanity';

import { getRequiredRole } from '../validation-rules';

export const contactPersonsField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersons',
	type: 'reference',
	to: [{ type: 'person' }],
	group: 'content',
	validation: rule => [getRequiredRole(rule, 'Ansprechpartner')],
});

export const contentField = defineField({
	title: 'Abschnitte',
	name: 'sections',
	type: 'array',
	of: [{ type: 'grid' }, { type: 'mainImage' }, { type: 'blockContent' }, { type: 'spacer' }],
	description: 'Abschnitte mit Inhalt hinzufügen, bearbeiten und neu anordnen.',
	group: 'content',
});
