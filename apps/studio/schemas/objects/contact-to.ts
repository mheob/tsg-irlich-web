import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const contactTo = defineField({
	fields: [
		{
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Der Name ist erforderlich')],
		},
		{
			name: 'email',
			title: 'E-Mail',
			type: 'email',
			validation: (Rule) => [Rule.required().error('Die E-Mail ist erforderlich')],
		},
	],
	icon: RiLinksLine,
	name: 'contactNameMail',
	title: 'Kontakt zu',
	type: 'object',
});

export default contactTo;
