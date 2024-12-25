import { defineField } from '@sanity-typed/types';
import { RiExternalLinkLine } from 'react-icons/ri';

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
			// validation: rule => rule.required(),
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
