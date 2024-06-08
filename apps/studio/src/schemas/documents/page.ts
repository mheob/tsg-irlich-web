import { RiPagesLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { contentField } from '../../shared/content-fields';
import { slugField, titleField } from '../../shared/general-fields';
import { metaField } from '../../shared/meta-fields';
import { content, general, meta } from '../../shared/roles';

const page = defineType({
	title: 'Seiten-Einstellungen',
	name: 'page',
	type: 'document',
	icon: RiPagesLine,
	groups: [general, meta, content],
	fields: [
		// general
		titleField,
		slugField,

		// meta
		metaField,

		// content
		defineField({
			...contentField,
			of: [
				// TODO: Create Label with Text/Images etc. components to use here
				{ type: 'grid' },
				{ type: 'mainImage' },
				{ type: 'blockContent' },
				{ type: 'spacer' },
			],
		}),
	],
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			title: 'title',
		},
	},
});

export default page;
