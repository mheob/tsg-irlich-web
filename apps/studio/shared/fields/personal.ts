import { defineField } from 'sanity';

import { getMaxLengthRule, getMinLengthRule, getRequiredRule } from '../validation-rules';

export const firstNameField = defineField({
	title: 'Vorname',
	name: 'firstName',
	type: 'string',
	group: 'personal',
	validation: rule => [getMinLengthRule(rule, 2, 'Vorname'), getMaxLengthRule(rule, 64, 'Vorname')],
});

export const lastNameField = defineField({
	title: 'Nachname',
	name: 'lastName',
	type: 'string',
	group: 'personal',
	validation: rule => [
		getMinLengthRule(rule, 2, 'Nachname'),
		getMaxLengthRule(rule, 64, 'Nachname'),
	],
});

export const portraitPictureField = defineField({
	title: 'Porträtbild',
	name: 'image',
	type: 'extendedImage',
	description: 'Erweitertes Porträtbild des Autors mit einem Alt-Text.',
	group: 'personal',
	validation: rule => [getRequiredRule(rule, 'Porträtbild')],
});
