import { LinkIcon } from '@sanity/icons';
import { defineField } from 'sanity';

const internalLink = defineField({
	title: 'Internal Link',
	name: 'internalLink',
	type: 'object',
	icon: LinkIcon,
	fields: [
		{
			title: 'Link',
			name: 'link',
			type: 'reference',
			description: 'Internen Link hinzufügen',
			to: [
				{ type: 'home' },
				{ type: 'aboutUs' },
				{ type: 'contact' },
				{ type: 'group.admin' },
				{ type: 'group.children-gymnastics' },
				{ type: 'group.courses' },
				{ type: 'group.dance' },
				{ type: 'group.other-sports' },
				{ type: 'group.soccer' },
				{ type: 'group.taekwondo' },
				{ type: 'membership' },
				{ type: 'news.article' },
				{ type: 'newsOverview' },
				{ type: 'accessibility' },
				{ type: 'privacy' },
				{ type: 'imprint' },
			],
			validation: (Rule) => Rule.required().error('Der Link ist erforderlich'),
		},
	],
});

export default internalLink;
