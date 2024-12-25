import { defineField } from '@sanity-typed/types';

export const firstNameField = defineField({
	title: 'Vorname',
	name: 'firstName',
	type: 'string',
	group: 'personal',
	validation: Rule => [
		Rule.required().min(2).error('Der Vorname muss mindestens 2 Zeichen lang sein.'),
		Rule.max(64).warning('Der Vorname sollte maximal 64 Zeichen lang sein.'),
	],
});

export const lastNameField = defineField({
	title: 'Nachname',
	name: 'lastName',
	type: 'string',
	group: 'personal',
	validation: Rule => [
		Rule.required().min(2).error('Der Nachname muss mindestens 2 Zeichen lang sein.'),
		Rule.max(64).warning('Der Nachname sollte maximal 64 Zeichen lang sein.'),
	],
});

export const portraitPictureField = defineField({
	title: 'Porträtbild',
	name: 'image',
	type: 'extendedImage',
	description: 'Erweitertes Porträtbild des Autors mit einem Alt-Text.',
	group: 'personal',
	validation: Rule => Rule.required().error('Das Porträtbild ist ein Pflichtfeld.'),
});
