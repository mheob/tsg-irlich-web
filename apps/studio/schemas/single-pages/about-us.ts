// cSpell:words verein

import { defineArrayMember, defineField, defineType } from '@sanity-typed/types';
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';

import { content, general, meta } from '@/shared/field-groups';
import {
	defaultPageFields,
	getDefaultPageFieldsWithGroup,
	getHiddenSlugField,
} from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';
import { visionField } from '@/shared/sections/vision';

const aboutUsPage = defineType({
	title: 'Über uns',
	name: 'aboutUs',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('verein'),

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
					validation: Rule => Rule.length(3).error('Es müssen genau 3 Bilder ausgewählt werden.'),
				}),
			],
		}),

		defineField({
			title: 'Chronik',
			name: 'chronicleSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'chronicle',
			fields: [
				...getDefaultPageFieldsWithGroup(),

				defineField({
					title: 'Chronik',
					name: 'chronicle',
					type: 'array',
					of: [defineArrayMember({ type: 'imageCard' })],
					description: 'Die Abschnitte der Chronik.',
				}),
			],
		}),

		visionField,
		statsField,
		contactPersonsSectionField,
	],
	preview: {
		prepare: () => ({ title: 'Über uns' }),
	},
});

export default aboutUsPage;
