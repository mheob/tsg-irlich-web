import { defineArrayMember, defineField, defineType } from '@sanity-typed/types';
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const singleGroupPage = defineType({
	title: 'Einzel-Gruppe',
	name: 'singleGroupPage',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// general
		...defaultPageFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Galerie',
			name: 'gallerySection',
			type: 'object',
			icon: RiLinksLine,
			group: 'gallery',
			fields: [
				...getDefaultPageFieldsWithGroup(),

				defineField({
					title: 'Bilder',
					name: 'images',
					type: 'array',
					of: [defineArrayMember({ type: 'extendedImage' })],
					description: 'Diese gewählten Bilder werden in der gewünschten Reihenfolge angezeigt.',
					validation: Rule => [
						Rule.required().error('Es müssen mindestens 2 Bilder ausgewählt werden.'),
						Rule.max(4).error('Es dürfen maximal vier Bilder ausgewählt werden.'),
					],
				}),
			],
		}),

		contactPersonsSectionField,
	],
	preview: {
		prepare: () => ({ title: 'Einzel-Gruppe' }),
	},
});

export default singleGroupPage;
