import { RiUserSmileLine } from 'react-icons/ri';
import { defineType } from 'sanity';

const person = defineType({
	title: 'Persons',
	name: 'person',
	type: 'document',
	icon: RiUserSmileLine,
	fields: [
		{
			title: 'Name',
			name: 'name',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Job title',
			name: 'jobTitle',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Phone',
			name: 'phone',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Email',
			name: 'email',
			type: 'email',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Image',
			name: 'image',
			type: 'image',
			options: {
				hotspot: true,
			},
			validation: Rule => Rule.required(),
		},
	],
	preview: {
		prepare: ({ media, firstName, lastName }) => ({ media, title: `${lastName}, ${firstName}` }),
		select: {
			media: 'image.asset',
			firstName: 'firstName',
			lastName: 'lastName',
		},
	},
});

export default person;
