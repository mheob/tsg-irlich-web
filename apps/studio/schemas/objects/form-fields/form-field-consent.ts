import { RiCheckboxLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { createBaseFields, prepareFieldPreview } from './base';

const formFieldConsent = defineType({
	fields: [
		...createBaseFields({ hidden: ['isRequired', 'retention'], isRequiredByDefault: true }),
		defineField({
			name: 'text',
			title: 'Text',
			type: 'simpleBlockContent',
			validation: (Rule) => Rule.required(),
		}),
	],
	icon: RiCheckboxLine,
	name: 'formFieldConsent',
	preview: {
		prepare: prepareFieldPreview('Zustimmung'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Zustimmung',
	type: 'object',
});

export default formFieldConsent;
