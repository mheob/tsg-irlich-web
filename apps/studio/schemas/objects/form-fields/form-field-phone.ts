import { RiPhoneLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { baseFieldDefinitions, prepareFieldPreview } from './base';

const formFieldPhone = defineType({
	fields: [...baseFieldDefinitions],
	icon: RiPhoneLine,
	name: 'formFieldPhone',
	preview: {
		prepare: prepareFieldPreview('Telefon'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Telefon',
	type: 'object',
});

export default formFieldPhone;
