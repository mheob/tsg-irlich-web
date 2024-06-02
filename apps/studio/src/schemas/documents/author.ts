import { RiUserSmileLine } from 'react-icons/ri';
import { defineType } from 'sanity';

const person = defineType({
	title: 'Authors',
	name: 'author',
	type: 'document',
	icon: RiUserSmileLine,
	fields: [
		{
			title: 'Last Name',
			name: 'lastName',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			title: 'First Name',
			name: 'firstName',
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
