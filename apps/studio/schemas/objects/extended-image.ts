import { RiImageLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { NamedImageInput } from '@/components/named-image-input';
import { apiVersion } from '@/env';

const extendedImage = defineField({
	title: 'Erweitertes Bild',
	name: 'extendedImage',
	type: 'image',
	description: 'Erweitertes Bild mit erforderlichem Alt-Text.',
	icon: RiImageLine,
	components: {
		input: NamedImageInput,
	},
	fields: [
		{
			title: 'Alt-Text',
			name: 'alt',
			type: 'string',
			description: 'Beschreibe, was auf dem Bild zu sehen ist (für SEO und Barrierefreiheit).',
			validation: Rule => [Rule.required().error('Der "Alt-Text" ist erforderlich')],
		},
		{
			title: 'Bildbeschreibung',
			name: 'description',
			type: 'string',
			description: 'Die Bildunterschrift wird unter dem Bild angezeigt.',
		},
	],
	options: {
		hotspot: true,
	},
	validation: rule =>
		rule.custom(async (value, context) => {
			if (!value?.asset?._ref) return true;

			const client = context.getClient({ apiVersion });
			const asset = await client.fetch(`*[_id == $id][0]{ originalFilename }`, {
				id: value.asset._ref,
			});

			// Check for generic camera/phone filenames
			const genericPatterns = /^(?:IMG_|DSC_|Screenshot|Bildschirmfoto|\d{8}_)/i;
			if (genericPatterns.test(asset?.originalFilename)) {
				return 'Bitte den Dateinamen vor oder bei dem Upload umbenennen (vermeide generische Namen wie IMG_1234)';
			}

			return true;
		}),
	preview: {
		prepare: ({ media, title }) => ({ media, title }),
		select: {
			media: 'asset',
			title: 'alt',
		},
	},
});

export default extendedImage;
