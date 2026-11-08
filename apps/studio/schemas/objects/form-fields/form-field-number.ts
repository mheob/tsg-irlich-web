import { RiHashtag } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { baseFieldDefinitions, prepareFieldPreview } from './base';

const formFieldNumber = defineType({
	fields: [
		...baseFieldDefinitions,
		defineField({ name: 'min', title: 'Minimum', type: 'number' }),
		defineField({ name: 'max', title: 'Maximum', type: 'number' }),
	],
	icon: RiHashtag,
	name: 'formFieldNumber',
	preview: {
		prepare: prepareFieldPreview('Zahl'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Zahl',
	type: 'object',
});

export default formFieldNumber;
