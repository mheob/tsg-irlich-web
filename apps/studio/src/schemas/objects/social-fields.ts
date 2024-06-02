import { RiShareLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const socialFields = defineField({
	title: 'Social',
	name: 'socialFields',
	type: 'object',
	icon: RiShareLine,
	fields: [
		{
			title: 'WhatsApp Number',
			name: 'whatsapp',
			type: 'url',
		},
		{
			title: 'Facebook URL',
			name: 'facebook',
			type: 'url',
		},
		{
			title: 'Instagram URL',
			name: 'instagram',
			type: 'url',
		},
		{
			title: 'YouTube URL',
			name: 'youtube',
			type: 'url',
		},
	],
});

export default socialFields;
