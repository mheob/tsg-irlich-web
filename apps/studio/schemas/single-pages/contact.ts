// cSpell:words kontakt
import { RiBookletLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { contactPersonsField } from '@/shared/fields/content';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { getRequiredRule } from '@/shared/validation-rules';

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
			of: [{ type: 'contactNameMail' }],
			description: 'Personen oder Bereiche, die im Kontaktformular kontaktiert werden können.',
			group: 'content',
			validation: rule => [getRequiredRule(rule, '"Kontakt zu"')],
		}),

		contactPersonsField,
	],
	preview: {
		prepare: () => ({ title: 'Kontakt' }),
	},
});

export default contactPage;
