import { defineField } from 'sanity';

import extendedImage from '@/schemas/objects/extended-image';

const mainImage = defineField({
	...extendedImage,
	name: 'mainImage',
	title: 'Image',
});

export default mainImage;
