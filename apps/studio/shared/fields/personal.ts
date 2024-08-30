import { defineField } from 'sanity';

import { maxLengthRule } from '../validation-rules';

export const firstNameField = defineField({
	title: 'Vorname',
	name: 'firstName',
	type: 'string',
	group: 'personal',
	validation: rule => [
		// minLengthRule(rule, 2, 'Der Vorname'),
		maxLengthRule(rule, 64, 'Der Vorname'),
	],
});

export const lastNameField = defineField({
	title: 'Nachname',
	name: 'lastName',
	type: 'string',
	group: 'personal',
	validation: rule => [
		// minLengthRule(rule, 2, 'Der Nachname'),
		maxLengthRule(rule, 64, 'Der Nachname'),
	],
});

export const portraitPictureField = defineField({
	title: 'Porträtbild',
	name: 'image',
	type: 'extendedImage',
	description: 'Erweitertes Porträtbild des Autors mit einem Alt-Text.',
	group: 'personal',
	// validation: rule => [requiredRule(rule, 'Das Porträtbild')],
});
