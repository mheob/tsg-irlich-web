// cSpell:words kontakt
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { requiredRule } from '@/shared/validation-rules';

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
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [{ title: 'Ansprechpartner', name: 'contactPersons' }],
			fields: [
				defineField({
					title: 'Kontakt zu',
					name: 'receiver',
					type: 'array',
					of: [{ type: 'contactNameMail' }],
					description: 'Personen oder Bereiche, die im Kontaktformular kontaktiert werden können.',
					validation: rule => [requiredRule(rule, 'Das Feld "Kontakt zu"')],
				}),
				contactPersonsSectionField,
			],
			validation: rule => [requiredRule(rule, 'Inhalte')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Kontakt' }),
	},
});

export default contactPage;
