import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import {
	defaultHeroFields,
	getDefaultPageSectionFieldsWithGroup,
	getHiddenSlugField,
} from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const membershipPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('mitgliedschaft'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

		// Content
		defineField({
			group: 'content',
			name: 'intro',
			title: 'Intro',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Intro ist erforderlich')],
		}),

		defineField({
			fields: [
				...getDefaultPageSectionFieldsWithGroup(),

				defineField({
					name: 'downloads',
					of: [{ type: 'documentDownload' }],
					title: 'Downloads',
					type: 'array',
					validation: (Rule) => [Rule.required().error('Downloads sind erforderlich')],
				}),
			],
			group: 'content',
			icon: RiLinksLine,
			name: 'downloadsSection',
			title: 'Download Bereich',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Dokumente sind erforderlich')],
		}),

		defineField({
			...contactPersonsSectionField,
			group: 'content',
		}),
	],
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'membership',
	preview: {
		prepare: () => ({ title: 'Mitgliedschaft' }),
	},
	title: 'Mitgliedschaft',
	type: 'document',
});

export default membershipPage;
