import { defineField } from 'sanity';

export const emailField = defineField({
	group: 'contact',
	name: 'email',
	title: 'E-Mail',
	type: 'email',
	validation: rule => [rule.required().error('E-Mail ist erforderlich.')],
});

export const phoneField = defineField({
	group: 'contact',
	name: 'phone',
	title: 'Telefon',
	type: 'string',
	validation: rule => [
		rule
			.regex(/^\+\d{2}\s\d{2,5}\s\d+$/)
			.warning('Die Telefonnummer sollte in der Form +49 123 456789 geschrieben werden.'),
	],
});
