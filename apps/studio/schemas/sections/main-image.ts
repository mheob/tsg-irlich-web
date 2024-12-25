import { defineField } from '@sanity-typed/types';

import extendedImage from '@/schemas/objects/extended-image';

const mainImage = defineField({
	...extendedImage,
	title: 'Image',
	name: 'mainImage',
});

export default mainImage;
