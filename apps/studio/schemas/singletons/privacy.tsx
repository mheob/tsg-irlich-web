import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { meta } from '@/shared/field-groups';
import { metaField } from '@/shared/meta-fields';

const privacy = defineType({
	title: 'Datenschutzerklärung',
	name: 'privacy',
	type: 'document',
	icon: RiSettings5Line,
	groups: [
		meta,
		{ name: 'additionalInfo', title: 'Nebeninformationen' },
		{ name: 'content', title: 'Erklärung' },
	],
	fields: [
		// (hidden)
		defineField({
			title: 'Slug',
			name: 'slug',
			type: 'slug',
			readOnly: true,
			initialValue: { current: 'datenschutz' },
			hidden: true,
		}),

		// meta
		metaField,

		// additionalInfo
		defineField({
			title: 'Einleitungstext',
			name: 'intro',
			type: 'simpleBlockContent',
			group: 'additionalInfo',
		}),
		defineField({
			title: 'Anschrift',
			name: 'address',
			type: 'text',
			group: 'additionalInfo',
		}),
		defineField({
			title: 'Telefonnummer',
			name: 'phone',
			type: 'url',
			group: 'additionalInfo',
		}),
		defineField({
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			group: 'additionalInfo',
		}),

		// content
		defineField({
			title: 'Datenschutzerklärung',
			name: 'content',
			type: 'blockContent',
			group: 'content',
		}),
	],
	preview: {
		prepare: () => ({ title: 'Datenschutzerklärung' }),
	},
});

export default privacy;
