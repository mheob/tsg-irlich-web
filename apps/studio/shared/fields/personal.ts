// oxlint-disable no-magic-numbers

import { defineField } from 'sanity';

const firstNameField = defineField({
	group: 'personal',
	name: 'firstName',
	title: 'Vorname',
	type: 'string',
	validation: (Rule) => [
		Rule.required().min(2).error('Der Vorname muss mindestens 2 Zeichen lang sein'),
		Rule.max(64).warning('Der Vorname sollte nicht länger als 64 Zeichen sein'),
	],
});

const lastNameField = defineField({
	group: 'personal',
	name: 'lastName',
	title: 'Nachname',
	type: 'string',
	validation: (Rule) => [
		Rule.required().min(2).error('Der Nachname muss mindestens 2 Zeichen lang sein'),
		Rule.max(64).warning('Der Nachname sollte nicht länger als 64 Zeichen sein'),
	],
});

const portraitPictureField = defineField({
	description: 'Erweitertes Porträtbild des Autors mit einem Alt-Text.',
	group: 'personal',
	name: 'image',
	title: 'Porträtbild',
	type: 'extendedImage',
	validation: (Rule) => [Rule.required().error('Das Porträtbild ist erforderlich')],
});

export { firstNameField, lastNameField, portraitPictureField };
