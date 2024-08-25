import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getRequiredRule } from '@/shared/validation-rules';

const contactTo = defineField({
	title: 'Kontakt zu',
	name: 'contactNameMail',
	type: 'object',
	icon: RiLinksLine,
	fields: [
		{
			title: 'Name',
			name: 'name',
			type: 'string',
			validation: rule => [getRequiredRule(rule, 'Name')],
		},
		{
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			validation: rule => [getRequiredRule(rule, 'E-Mail')],
		},
	],
});

export default contactTo;
