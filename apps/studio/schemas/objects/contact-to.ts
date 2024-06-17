import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getRequiredRole } from '@/shared/validation-rules';

const contactTo = defineField({
	title: 'Kontakt zu',
	name: 'contactNameMail',
	type: 'object',
	icon: RiLinksLine,
	hidden: true,
	fields: [
		{
			title: 'Name',
			name: 'name',
			type: 'string',
			validation: rule => [getRequiredRole(rule, 'Name')],
		},
		{
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			validation: rule => [getRequiredRole(rule, 'E-Mail')],
		},
	],
});

export default contactTo;
