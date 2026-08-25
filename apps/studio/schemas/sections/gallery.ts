import { RiGalleryLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineArrayMember, defineField } from 'sanity';

const MAX_IMAGES = 24;

const gallery = defineField({
	description: 'Mehrere Bilder als Galerie, die sich in einer Lightbox durchblättern lassen.',
	fields: [
		defineField({
			description: 'Optionale Überschrift, die über der Galerie angezeigt wird.',
			name: 'title',
			title: 'Titel',
			type: 'string',
		}),
		defineField({
			description: `Es können bis zu ${MAX_IMAGES} Bilder ausgewählt werden.`,
			name: 'images',
			of: [defineArrayMember({ type: 'extendedImage' })],
			options: { layout: 'grid' },
			title: 'Bilder',
			type: 'array',
			validation: (Rule) => [
				Rule.required().min(1).error('Es muss mindestens ein Bild ausgewählt werden.'),
				Rule.max(MAX_IMAGES).error(`Es dürfen maximal ${MAX_IMAGES} Bilder ausgewählt werden.`),
			],
		}),
	],
	icon: RiGalleryLine,
	name: 'gallery',
	preview: {
		prepare: ({
			imageCount,
			media,
			title,
		}: {
			imageCount?: number;
			media?: PreviewValue['media'];
			title?: string;
		}) => ({
			media,
			subtitle: imageCount === 1 ? '1 Bild' : `${imageCount ?? 0} Bilder`,
			title: title ?? 'Bildergalerie',
		}),
		select: {
			imageCount: 'images.length',
			media: 'images.0.asset',
			title: 'title',
		},
	},
	title: 'Bildergalerie',
	type: 'object',
});

export default gallery;
