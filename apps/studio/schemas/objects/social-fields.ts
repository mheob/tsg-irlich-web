import { RiShareLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const socialFields = defineField({
	fields: [
		{
			name: 'whatsapp',
			title: 'WhatsApp Number',
			type: 'url',
		},
		{
			name: 'facebook',
			title: 'Facebook URL',
			type: 'url',
		},
		{
			name: 'instagram',
			title: 'Instagram URL',
			type: 'url',
		},
		{
			name: 'youtube',
			title: 'YouTube URL',
			type: 'url',
		},
	],
	icon: RiShareLine,
	name: 'socialFields',
	title: 'Social',
	type: 'object',
});

export default socialFields;
