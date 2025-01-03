import { RiExternalLinkLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const externalLink = defineField({
	title: 'External Link',
	name: 'externalLink',
	type: 'object',
	icon: RiExternalLinkLine,
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: Rule => Rule.required().error('Der Titel ist erforderlich'),
		},
		{
			title: 'URL',
			name: 'url',
			type: 'url',
			description: 'Add external link',
			validation: Rule => Rule.required().error('Die URL ist erforderlich'),
		},
	],
});

export default externalLink;
