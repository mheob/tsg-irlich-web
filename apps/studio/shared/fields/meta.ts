import { defineField } from 'sanity';

import { getRequiredRole } from '../validation-rules';

export const authorField = defineField({
	title: 'Autor',
	name: 'author',
	type: 'reference',
	to: [{ type: 'author' }],
	description: 'Autor für Beitrag auswählen',
	group: 'meta',
	validation: rule => [getRequiredRole(rule, 'Autor')],
});

export const metaField = defineField({
	title: 'Meta',
	name: 'meta',
	type: 'metaFields',
	group: 'meta',
});
