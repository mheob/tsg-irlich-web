import { defineField } from 'sanity';

import extendedImage from '@/schemas/objects/extended-image';

const mainImage = defineField({
	...extendedImage,
	title: 'Image',
	name: 'mainImage',
});

export default mainImage;
