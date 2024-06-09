import { defineField } from 'sanity';

export const firstNameField = defineField({
	group: 'personal',
	name: 'firstName',
	title: 'Vorname',
	type: 'string',
	validation: rule => [
		rule.required().min(2).error('Der Vorname muss mindestens 2 Zeichen lang sein.'),
		rule.max(64).warning('Der Vorname muss weniger als 64 Zeichen lang sein.'),
	],
});

export const lastNameField = defineField({
	group: 'personal',
	name: 'lastName',
	title: 'Nachname',
	type: 'string',
	validation: rule => [
		rule.required().min(2).error('Der Nachname muss mindestens 2 Zeichen lang sein.'),
		rule.max(64).warning('Der Nachname sollte maximal 64 Zeichen lang sein.'),
	],
});

export const portraitPictureField = defineField({
	description: 'Erweitertes Porträtbild des Autors mit einem Alt-Text.',
	group: 'personal',
	name: 'image',
	title: 'Porträtbild',
	type: 'extendedImage',
	validation: rule => rule.required().error('Porträtbild ist erforderlich.'),
});
