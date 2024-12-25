import { defineField } from '@sanity-typed/types';
import { RiShareLine } from 'react-icons/ri';

const socialFields = defineField({
	title: 'Social',
	name: 'socialFields',
	type: 'object',
	icon: RiShareLine,
	fields: [
		defineField({
			title: 'WhatsApp Number',
			name: 'whatsapp',
			type: 'url',
		}),
		defineField({
			title: 'Facebook URL',
			name: 'facebook',
			type: 'url',
		}),
		defineField({
			title: 'Instagram URL',
			name: 'instagram',
			type: 'url',
		}),
		defineField({
			title: 'YouTube URL',
			name: 'youtube',
			type: 'url',
		}),
	],
});

export default socialFields;
