import { defineField } from '@sanity-typed/types';
import { RiExternalLinkLine } from 'react-icons/ri';

const imageCard = defineField({
	title: 'Kachel mit Bild',
	name: 'imageCard',
	type: 'object',
	description: 'Die Abschnitte der Chronik.',
	icon: RiExternalLinkLine,
	fields: [
		defineField({
			title: 'Titel',
			name: 'title',
			type: 'string',
		}),
		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'text',
		}),
		defineField({
			title: 'Bild',
			name: 'image',
			type: 'extendedImage',
		}),
	],
});

export default imageCard;
