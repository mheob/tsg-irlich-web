import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

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
			// validation: rule => [requiredRule(rule, 'Der Name')],
		},
		{
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			// validation: rule => [requiredRule(rule, 'Die E-Mail')],
		},
	],
});

export default contactTo;
