// cSpell:words mitgliedschaft
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
	title: 'Mitgliedschaft',
	name: 'membership',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('mitgliedschaft'),

		// general
		...defaultHeroFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Intro',
			name: 'intro',
			type: 'blockContent',
			group: 'content',
			validation: Rule => [Rule.required().error('Intro ist erforderlich')],
		}),

		defineField({
			title: 'Download Bereich',
			name: 'downloadsSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			fields: [
				...getDefaultPageSectionFieldsWithGroup(),

				defineField({
					title: 'Downloads',
					name: 'downloads',
					type: 'array',
					of: [{ type: 'documentDownload' }],
					validation: Rule => [Rule.required().error('Downloads sind erforderlich')],
				}),
			],
			validation: Rule => [Rule.required().error('Dokumente sind erforderlich')],
		}),

		defineField({
			...contactPersonsSectionField,
			group: 'content',
		}),
	],
	preview: {
		prepare: () => ({ title: 'Mitgliedschaft' }),
	},
});

export default membershipPage;
