import { defineField } from 'sanity';

import { phoneFieldRegex } from '@/constants/regex';

export const addressField = defineField({
	title: 'Anschrift',
	name: 'address',
	type: 'text',
	group: 'contact',
	validation: Rule => [Rule.required().error('Die Anschrift ist erforderlich')],
});

export const emailField = defineField({
	title: 'E-Mail',
	name: 'email',
	type: 'email',
	group: 'contact',
	validation: Rule => [Rule.required().error('Die E-Mail ist erforderlich')],
});

export const phoneField = defineField({
	title: 'Telefon',
	name: 'phone',
	type: 'string',
	group: 'contact',
	validation: Rule => [
		Rule.regex(phoneFieldRegex).error(
			'Telefonnummer ist ungültig, sie muss wie folgt aussehen: +49 123 456789',
		),
	],
});

export const contactPersonsField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersons',
	type: 'array',
	of: [{ type: 'reference', to: [{ type: 'person' }] }],
	group: 'content',
	validation: Rule => [Rule.required().error('Ansprechpartner ist erforderlich')],
});
