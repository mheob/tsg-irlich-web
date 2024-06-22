import { RiExternalLinkLine } from 'react-icons/ri';
import { defineField } from 'sanity';

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
