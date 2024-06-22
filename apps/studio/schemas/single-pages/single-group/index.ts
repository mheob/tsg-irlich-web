// cSpell:words angebot
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

import { contactPersons, gallery } from './_groups';
import { galleryField } from './groups';

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
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [gallery, contactPersons],
			fields: [galleryField, contactPersonsSectionField],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Einzel-Gruppe' }),
	},
});

export default singleGroupPage;
