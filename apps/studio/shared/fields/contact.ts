import { defineField } from 'sanity';

import { phoneFieldRegexRule, requiredRule } from '../validation-rules';

export const addressField = defineField({
	title: 'Anschrift',
	name: 'address',
	type: 'text',
	group: 'contact',
	validation: rule => [requiredRule(rule, 'Die Anschrift')],
});

export const emailField = defineField({
	title: 'E-Mail',
	name: 'email',
	type: 'email',
	group: 'contact',
	validation: rule => [requiredRule(rule, 'Die E-Mail')],
});

export const phoneField = defineField({
	title: 'Telefon',
	name: 'phone',
	type: 'string',
	group: 'contact',
	validation: rule => [phoneFieldRegexRule(rule)],
});

export const contactPersonsField = defineField({
	title: 'Ansprechpartner',
	name: 'contactPersons',
	type: 'array',
	of: [{ type: 'reference', to: [{ type: 'person' }] }],
	group: 'content',
	validation: rule => [requiredRule(rule, 'Der Ansprechpartner')],
});
