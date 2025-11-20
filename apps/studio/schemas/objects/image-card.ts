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
			validation: Rule => [Rule.required().error('Der Titel ist erforderlich')],
		}),
		defineField({
			title: 'Vorschautext',
			name: 'excerpt',
			type: 'text',
			validation: Rule => [Rule.required().error('Der Vorschautext ist erforderlich')],
		}),
		defineField({
			title: 'Beschreibung',
			name: 'description',
			type: 'text',
			validation: Rule => [Rule.required().error('Die Beschreibung ist erforderlich')],
		}),
		defineField({
			title: 'Bild',
			name: 'image',
			type: 'extendedImage',
			validation: Rule => [Rule.required().error('Das Bild ist erforderlich')],
		}),
	],
	validation: Rule => [Rule.required().error('Die Kachel mit Bild ist erforderlich')],
});

export default imageCard;
