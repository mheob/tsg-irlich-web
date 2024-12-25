import { defineArrayMember, defineField } from '@sanity-typed/types';

import { phoneFieldRegex } from '@/constants/regex';

export const addressField = defineField({
	title: 'Anschrift',
	name: 'address',
	type: 'text',
	group: 'contact',
	validation: Rule => Rule.required().error('Die Anschrift ist ein Pflichtfeld.'),
});

export const emailField = defineField({
	title: 'E-Mail',
	name: 'email',
	type: 'email',
	group: 'contact',
	validation: Rule => Rule.required().error('Die E-Mail ist ein Pflichtfeld.'),
});

export const phoneField = defineField({
	title: 'Telefon',
	name: 'phone',
	type: 'string',
	group: 'contact',
	validation: Rule =>
		Rule.regex(phoneFieldRegex).warning(
			'Die Telefonnummer sollte in der Form +49 123 456789 geschrieben werden.',
		),
});

export const contactPersonsField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersons',
	type: 'array',
	of: [defineArrayMember({ type: 'reference', to: [{ type: 'person' }] })],
	group: 'content',
	validation: Rule => Rule.required().error('Der Ansprechpartner ist ein Pflichtfeld.'),
});
