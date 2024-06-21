import { defineField } from 'sanity';

import { getPhoneFieldRegexRule } from '../validation-rules';

export const addressField = defineField({
	title: 'Anschrift',
	name: 'address',
	type: 'text',
	group: 'contact',
});

export const emailField = defineField({
	title: 'E-Mail',
	name: 'email',
	type: 'email',
	group: 'contact',
});

export const phoneField = defineField({
	title: 'Telefon',
	name: 'phone',
	type: 'string',
	group: 'contact',
	validation: rule => [getPhoneFieldRegexRule(rule)],
});
