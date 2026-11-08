import { RiMailLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { baseFieldDefinitions, hideInsideGroup, prepareFieldPreview } from './base';

const formFieldEmail = defineType({
	fields: [
		...baseFieldDefinitions,
		defineField({
			hidden: hideInsideGroup,
			name: 'isConfirmationRecipient',
			title: 'Empfänger der Bestätigung',
			type: 'boolean',
		}),
	],
	icon: RiMailLine,
	name: 'formFieldEmail',
	preview: {
		prepare: prepareFieldPreview('E-Mail'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'E-Mail',
	type: 'object',
});

export default formFieldEmail;
