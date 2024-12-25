// cSpell:words kontakt
import { defineArrayMember, defineField, defineType } from '@sanity-typed/types';
import { RiBookletLine } from 'react-icons/ri';

import { content, general, meta } from '@/shared/field-groups';
import { contactPersonsField } from '@/shared/fields/contact';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const contactPage = defineType({
	title: 'Kontakt',
	name: 'contact',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('kontakt'),

		// general
		...defaultPageFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Kontakt zu',
			name: 'contactTo',
			type: 'array',
			of: [defineArrayMember({ type: 'contactNameMail' })],
			description: 'Personen oder Bereiche, die im Kontaktformular kontaktiert werden können.',
			group: 'content',
			validation: Rule => Rule.required().error('Das Feld "Kontakt zu" ist erforderlich'),
		}),

		contactPersonsField,
	],
	preview: {
		prepare: () => ({ title: 'Kontakt' }),
	},
});

export default contactPage;
