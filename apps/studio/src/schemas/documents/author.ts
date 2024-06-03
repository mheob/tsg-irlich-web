import { RiUserSmileLine } from 'react-icons/ri';
import { defineType } from 'sanity';

const author = defineType({
	title: 'Autor',
	name: 'author',
	type: 'document',
	icon: RiUserSmileLine,
	fields: [
		{
			title: 'Vorname',
			name: 'firstName',
			type: 'string',
			validation: rule => [
				rule.required().min(2).error('Der Vorname muss mindestens 2 Zeichen lang sein.'),
				rule.max(64).warning('Der Vorname muss weniger als 64 Zeichen lang sein.'),
			],
		},
		{
			title: 'Nachname',
			name: 'lastName',
			type: 'string',
			validation: rule => [
				rule.required().min(2).error('Der Nachname muss mindestens 2 Zeichen lang sein.'),
				rule.max(64).warning('Der Nachname sollte weniger als 64 Zeichen lang sein.'),
			],
		},
		{
			title: 'Jobtitel',
			name: 'jobTitle',
			type: 'string',
			description: 'Die Jobtitel, Rolle oder Funktion des Autors.',
			validation: rule => [
				rule.required().min(5).error('Der Jobtitel muss mindestens 5 Zeichen lang sein.'),
				rule.max(64).warning('Der Jobtitel sollte weniger als 64 Zeichen lang sein.'),
			],
		},
		{
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			validation: rule => [
				rule.required().error('E-Mail ist erforderlich.'),
				rule.max(128).warning('Die E-Mail-Adresse sollte weniger als 128 Zeichen lang sein.'),
			],
		},
		{
			title: 'Porträtbild',
			name: 'image',
			type: 'extendedImage',
			description: 'Erweitertes Porträtbild des Autors mit einem Alt-Text.',
			validation: rule => rule.required().error('Porträtbild ist erforderlich.'),
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
