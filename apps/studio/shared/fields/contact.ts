import { defineField } from 'sanity';

import { phoneFieldRegex } from '@/constants/regex';

const addressField = defineField({
	group: 'contact',
	name: 'address',
	title: 'Anschrift',
	type: 'text',
	validation: (Rule) => [Rule.required().error('Die Anschrift ist erforderlich')],
});

const emailField = defineField({
	group: 'contact',
	name: 'email',
	title: 'E-Mail',
	type: 'email',
	validation: (Rule) => [Rule.required().error('Die E-Mail ist erforderlich')],
});

const phoneField = defineField({
	group: 'contact',
	name: 'phone',
	title: 'Telefon',
	type: 'string',
	validation: (Rule) => [
		Rule.regex(phoneFieldRegex).error(
			'Telefonnummer ist ungültig, sie muss wie folgt aussehen: +49 123 456789',
		),
	],
});

const contactAsField = defineField({
	group: 'contact',
	// oxlint-disable-next-line typescript/no-unsafe-member-access
	hidden: ({ parent }) => !parent?.phone,
	// oxlint-disable-next-line typescript/no-unsafe-member-access
	initialValue: ({ parent }) => (parent?.phone ? 'both' : 'email'),
	name: 'contactAs',
	options: {
		list: [
			{ title: 'nur per E-Mail', value: 'email' },
			{ title: 'nur per Telefon', value: 'phone' },
			{ title: 'nur per WhatsApp', value: 'whatsapp' },
			{ title: 'per Telefon und WhatsApp', value: 'both' },
		],
	},
	title: 'Kontakt per',
	type: 'string',
	validation: (Rule) => [Rule.required().error('Die "Kontakt per"-Auswahl ist erforderlich')],
});

const contactPersonsField = defineField({
	group: 'content',
	name: 'contactPersons',
	of: [{ to: [{ type: 'person' }], type: 'reference' }],
	title: 'Ansprechpartner',
	type: 'array',
	validation: (Rule) => [Rule.required().error('Ansprechpartner ist erforderlich')],
});

export { addressField, contactAsField, contactPersonsField, emailField, phoneField };
