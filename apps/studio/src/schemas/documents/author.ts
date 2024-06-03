import { RiParentLine } from 'react-icons/ri';
import { defineType } from 'sanity';

const author = defineType({
	title: 'Autor',
	name: 'author',
	type: 'document',
	icon: RiParentLine,
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
				rule.max(64).warning('Der Nachname sollte maximal 64 Zeichen lang sein.'),
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
				rule.max(128).warning('Die E-Mail-Adresse sollte maximal 128 Zeichen lang sein.'),
			],
		},
		{
			title: 'Jobtitel',
			name: 'jobTitle',
			type: 'string',
			description: 'Der Jobtitel bzw. Rolle oder Funktion des Autors.',
			group: 'information',
			validation: rule => [
				rule.required().min(5).error('Der Jobtitel muss mindestens 5 Zeichen lang sein.'),
				rule.max(64).warning('Der Jobtitel sollte maximal 64 Zeichen lang sein.'),
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

export default author;
