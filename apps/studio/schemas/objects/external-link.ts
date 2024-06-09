import { RiExternalLinkLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const externalLink = defineField({
	title: 'External Link',
	name: 'externalLink',
	type: 'object',
	icon: RiExternalLinkLine,
	hidden: true,
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: rule => rule.required(),
		},
		{
			title: 'URL',
			name: 'url',
			type: 'url',
			description: 'Add external link',
		},
	],
});

export default externalLink;
