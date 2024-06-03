import { RiChatQuoteLine } from 'react-icons/ri';
import { defineType } from 'sanity';

const testimonial = defineType({
	title: 'Referenz',
	name: 'testimonial',
	type: 'document',
	icon: RiChatQuoteLine,
	groups: [
		{
			title: 'Persönliches',
			name: 'personal',
		},
		{
			title: 'Zitat',
			name: 'quote',
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
			title: 'Rolle',
			name: 'role',
			type: 'string',
			description: 'Die Rolle oder Funktion des Zitierenden.',
			group: 'personal',
			validation: rule => [
				rule.required().min(5).error('Die Rolle muss mindestens 5 Zeichen lang sein.'),
				rule.max(64).warning('Die Rolle sollte maximal 64 Zeichen lang sein.'),
			],
		},
		{
			title: 'Zitat',
			name: 'quote',
			type: 'string',
			description: 'Das Zitat über die TSG.',
			group: 'quote',
			validation: rule => [
				rule.required().min(64).error('Das muss mindestens 64 Zeichen lang sein.'),
				rule.max(256).warning('Das sollte maximal 256 Zeichen lang sein.'),
			],
		},
		{
			title: 'Zitat immer anzeigen',
			name: 'showAlways',
			type: 'boolean',
			description: 'Das Zitat soll immer angezeigt werden.',
			group: 'quote',
			initialValue: false,
		},
	],
	preview: {
		prepare: ({ media, firstName, lastName, role }) => ({
			media,
			title: `${lastName}, ${firstName} - ${role}`,
		}),
		select: {
			media: 'image.asset',
			firstName: 'firstName',
			lastName: 'lastName',
			role: 'role',
		},
	},
});

export default testimonial;
