import { LinkIcon } from '@sanity/icons';
import { defineField } from 'sanity';

const internalLink = defineField({
	fields: [
		{
			description: 'Internen Link hinzufügen',
			name: 'link',
			title: 'Link',
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
			type: 'reference',
			validation: (Rule) => Rule.required().error('Der Link ist erforderlich'),
		},
	],
	icon: LinkIcon,
	name: 'internalLink',
	title: 'Internal Link',
	type: 'object',
});

export default internalLink;
