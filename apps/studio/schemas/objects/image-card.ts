import { RiExternalLinkLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const imageCard = defineField({
	description: 'Die Abschnitte der Chronik.',
	fields: [
		defineField({
			name: 'title',
			title: 'Titel',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Der Titel ist erforderlich')],
		}),
		defineField({
			name: 'excerpt',
			title: 'Vorschautext',
			type: 'text',
			validation: (Rule) => [Rule.required().error('Der Vorschautext ist erforderlich')],
		}),
		defineField({
			name: 'description',
			title: 'Beschreibung',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Die Beschreibung ist erforderlich')],
		}),
		defineField({
			name: 'image',
			title: 'Bild',
			type: 'extendedImage',
			validation: (Rule) => [Rule.required().error('Das Bild ist erforderlich')],
		}),
	],
	icon: RiExternalLinkLine,
	name: 'imageCard',
	title: 'Kachel mit Bild',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Die Kachel mit Bild ist erforderlich')],
});

export default imageCard;
