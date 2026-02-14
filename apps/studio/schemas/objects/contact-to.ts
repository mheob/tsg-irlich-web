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
			validation: (Rule) => [Rule.required().error('Der Name ist erforderlich')],
		},
		{
			title: 'E-Mail',
			name: 'email',
			type: 'email',
			validation: (Rule) => [Rule.required().error('Die E-Mail ist erforderlich')],
		},
	],
});

export default contactTo;
