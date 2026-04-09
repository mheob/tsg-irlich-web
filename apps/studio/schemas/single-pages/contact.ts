import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';

const contactPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('kontakt'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

		// Content
		defineField({
			fields: [
				defineField({
					description: 'Personen oder Bereiche, die im Kontaktformular kontaktiert werden können.',
					name: 'receiver',
					of: [{ type: 'contactNameMail' }],
					title: 'Kontakt zu',
					type: 'array',
					validation: (Rule) => [Rule.required().error('Das Feld "Kontakt zu" ist erforderlich')],
				}),
				contactPersonsSectionField,
			],
			group: 'content',
			groups: [{ name: 'contactPersons', title: 'Ansprechpartner' }],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'contact',
	preview: {
		prepare: () => ({ title: 'Kontakt' }),
	},
	title: 'Kontakt',
	type: 'document',
});

export default contactPage;
