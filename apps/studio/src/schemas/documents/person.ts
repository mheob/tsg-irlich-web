import { RiUserSmileLine } from 'react-icons/ri';
import { defineType } from 'sanity';

const person = defineType({
	title: 'Person',
	name: 'person',
	type: 'document',
	icon: RiUserSmileLine,
	groups: [
		{
			title: 'Persönliches',
			name: 'personal',
		},
		{
			title: 'Kontaktdaten',
			name: 'contact',
		},
		{
			title: 'Information',
			name: 'information',
		},
	],
	fields: [
		{
			title: 'Vorname',
			name: 'firstName',
			type: 'string',
			group: 'personal',
			validation: rule => [
				rule.required().min(2).error('Der Vorname muss mindestens 2 Zeichen lang sein.'),
				rule.max(64).warning('Der Vorname muss weniger als 64 Zeichen lang sein.'),
			],
		},
		{
			title: 'Nachname',
			name: 'lastName',
			type: 'string',
			group: 'personal',
			validation: rule => [
				rule.required().min(2).error('Der Nachname muss mindestens 2 Zeichen lang sein.'),
				rule.max(64).warning('Der Nachname sollte weniger als 64 Zeichen lang sein.'),
			],
		},
		{
			title: 'Porträtbild',
			name: 'image',
			type: 'extendedImage',
			group: 'personal',
			description: 'Erweitertes Porträtbild des Autors mit einem Alt-Text.',
			validation: rule => rule.required().error('Porträtbild ist erforderlich.'),
		},
		{
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			group: 'contact',
			validation: rule => [
				rule.required().email().error('E-Mail ist erforderlich.'),
				rule.max(128).warning('Die E-Mail-Adresse sollte weniger als 128 Zeichen lang sein.'),
			],
		},
		{
			title: 'Telefon',
			name: 'phone',
			type: 'string',
			group: 'contact',
			validation: rule => [
				rule
					.regex(/^\+\d{2}\s\d{2,5}\s\d+$/)
					.warning('Die Telefonnummer sollte in der Form +49 123 456789 geschrieben werden.'),
			],
		},
		{
			title: 'Abteilung, Gruppe etc.',
			name: 'department',
			type: 'string',
			description: 'Die Gruppe oder Abteilung der Person.',
			group: 'information',
			validation: rule => [
				rule
					.required()
					.min(2)
					.error('Die Gruppe oder Abteilung muss mindestens 2 Zeichen lang sein.'),
				rule.max(64).warning('Die Gruppe oder Abteilung sollte weniger als 64 Zeichen lang sein.'),
			],
		},
		{
			title: 'Rolle',
			name: 'role',
			type: 'reference',
			to: [{ type: 'group' }],
			description: 'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen).',
			group: 'information',
			validation: rule => [rule.required().error('Die Rolle oder Funktion ist erforderlich.')],
		},
		{
			title: 'Beschreibung (Vision)',
			name: 'description',
			type: 'string',
			description: 'Eine kurze Beschreibung der Person.',
			group: 'information',
			validation: rule => [
				rule.required().min(32).error('Die Beschreibung muss mindestens 32 Zeichen lang sein.'),
				rule.max(64).warning('Die Beschreibung sollte weniger als 64 Zeichen lang sein.'),
			],
		},
	],
	preview: {
		prepare: ({ media, firstName, lastName }) => ({ media, title: `${lastName}, ${firstName}` }),
		select: {
			media: 'image.asset',
			firstName: 'firstName',
			lastName: 'lastName',
		},
	},
});

export default person;
